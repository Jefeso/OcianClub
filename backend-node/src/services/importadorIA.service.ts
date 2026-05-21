import 'dotenv/config';
import { PrismaClient, TipoCompeticao, TipoCategoria, StatusPartida } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai'; 

const prisma = new PrismaClient();
const genIA = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ImportacaoInput {
  competicaoId: number;
  conteudo: string | Buffer;
  mimeType: string;
}

function filtrarLinhasOcian(texto: string): string {
  const linhas = texto.split('\n');
  const indices = new Set<number>();
  linhas.forEach((linha, i) => {
    if (linha.toLowerCase().includes('ocian')) {
      for (let j = Math.max(0, i - 2); j <= Math.min(linhas.length - 1, i + 2); j++) {
        indices.add(j);
      }
    }
  });
  return Array.from(indices).sort((a, b) => a - b).map(i => linhas[i]).join('\n');
}

export async function importarPartidas({ competicaoId, conteudo, mimeType }: ImportacaoInput) {
  const competicao = await prisma.competicao.findUniqueOrThrow({ where: { id: competicaoId } });
  const ehBase = competicao.tipo === TipoCompeticao.BASE;

  const prompt = `
Você é especialista em ler tabelas da Federação Paulista de Futsal.
Extraia TODOS os jogos únicos onde "Ocian" (ou "Ocian Praia Clube" ou "Ocian Praia Clube/AJR") aparece.

Tipo: ${competicao.tipo}
${ehBase ? 'COMPETIÇÃO BASE - tem grupos A, B e C. Capture a letra do grupo.' : 'COMPETIÇÃO INICIAÇÃO - sem grupos.'}

REGRAS:
1. Extraia TODOS os jogos.
2. Ocian no lado DIREITO = visitante (ocianMandante: false).
3. Ocian no lado ESQUERDO = mandante (ocianMandante: true).
4. Data em YYYY-MM-DD e Horário em HH:MM.
5. NÃO duplique jogos. Devolva APENAS array JSON.
Formato: [{"grupo": "C", "data": "2026-05-02", "horario": "14:30", "local": "Arena", "adversario": "AD GALATA", "ocianMandante": false}]
  `.trim();

  let respostaRaw: string;
  const model = genIA.getGenerativeModel({ model: 'gemini-3.5-flash-TTS' });

  if (mimeType.includes('text')) {
    const texto = typeof conteudo === 'string' ? conteudo : conteudo.toString('utf-8');
    const filtrado = filtrarLinhasOcian(texto);
    const result = await model.generateContent(`${prompt}\nJogos:\n${filtrado}`);
    respostaRaw = result.response.text().trim();
  } else {
    const buffer = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo);
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString('base64'), mimeType } }
    ]);
    respostaRaw = result.response.text().trim();
  }

  let limpa = respostaRaw.replace(/```json/g, '').replace(/```/g, '').trim();
  let jogos = JSON.parse(limpa.slice(limpa.indexOf('['), limpa.lastIndexOf(']') + 1));

  // Ordenação e Rodadas
  jogos.sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const grupoGlobal = jogos.find((j: any) => j.grupo)?.grupo ?? null;
  jogos = jogos.map((j: any, i: number) => ({ ...j, rodada: i + 1, grupo: grupoGlobal ?? j.grupo ?? null }));

  const tipoCategoria = competicao.tipo === TipoCompeticao.BASE ? TipoCategoria.BASE : TipoCategoria.INICIACAO;
  const categorias = await prisma.categoria.findMany({ where: { tipo: tipoCategoria } });

  const resultadoFinal = { criados: 0, pulados: 0, logs: [] as any[] };
  const hoje = new Date();

  for (const jogo of jogos) {
    const [horaBase, minBase] = jogo.horario.split(':').map(Number);
    const dataDaPartida = new Date(`${jogo.data}T00:00:00Z`);
    const statusDaPartida = dataDaPartida < hoje ? StatusPartida.FINALIZADA : StatusPartida.AGENDADA;

    for (let i = 0; i < categorias.length; i++) {
      const cat = categorias[i];
      const hora = (horaBase + i) % 24;
      const horarioFinal = `${String(hora).padStart(2, '0')}:${String(minBase).padStart(2, '0')}`;

      // Travas de Segurança
      const existeRodada = await prisma.partida.findFirst({ where: { competicao_id: competicaoId, categoria_id: cat.id, rodada: jogo.rodada } });
      const existeHorario = await prisma.partida.findFirst({ where: { categoria_id: cat.id, data: dataDaPartida, horario: horarioFinal } });

      if (existeRodada || existeHorario) {
        resultadoFinal.pulados++;
        continue;
      }

      // Garante times
      let timeOcian = await prisma.time.findFirst({ where: { nome: { contains: 'Ocian', mode: 'insensitive' }, categoria_id: cat.id } });
      if (!timeOcian) timeOcian = await prisma.time.create({ data: { nome: 'CFA Ocian', categoria_id: cat.id } });

      let timeAdversario = await prisma.time.findFirst({ where: { nome: { contains: jogo.adversario, mode: 'insensitive' }, categoria_id: cat.id } });
      if (!timeAdversario) timeAdversario = await prisma.time.create({ data: { nome: jogo.adversario, categoria_id: cat.id } });

      await prisma.partida.create({
        data: {
          competicao_id: competicaoId, categoria_id: cat.id, rodada: jogo.rodada, grupo: jogo.grupo,
          data: dataDaPartida, horario: horarioFinal, status: statusDaPartida, local: jogo.local,
          emCasa: Boolean(jogo.ocianMandante),
          mandante_id: jogo.ocianMandante ? timeOcian.id : timeAdversario.id,
          visitante_id: jogo.ocianMandante ? timeAdversario.id : timeOcian.id,
        }
      });
      resultadoFinal.criados++;
    }
  }
  return resultadoFinal;
}