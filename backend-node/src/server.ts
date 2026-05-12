import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_seguro_ocian';
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// ==========================================
// 1. AUTENTICAÇÃO E USUÁRIOS
// ==========================================

app.post('/auth/registrar', async (req, res) => {
    const { email, senha, nome, role } = req.body;
    try {
        const hashSenha = await bcrypt.hash(senha, 10);
        const usuario = await prisma.usuario.create({
          data: { email, senha: hashSenha, nome, role }
        });
        res.status(201).json({ mensagem: "Usuário criado com sucesso", id: usuario.id });
    } catch (error) {
        res.status(400).json({ error: 'Erro ao criar usuário' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: usuario.id, role: usuario.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: usuario.role, nome: usuario.nome, criadoEm: usuario.criadoEm, email: usuario.email });
});

app.patch('/usuarios/me', async (req, res) => {
  const { nome, email, senha } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não enviado' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const data: any = { nome, email };
    if (senha && senha.length >= 6) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: decoded.id },
      data,
    });

    res.json({ nome: usuario.nome, email: usuario.email });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.delete('/usuarios/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não enviado' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    await prisma.usuario.delete({ where: { id: decoded.id } });

    res.json({ mensagem: 'Conta excluída com sucesso' });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou usuário não encontrado' });
  }
});

// 2. CADASTROS E BUSCAS

app.post('/times', async (req, res) => {
  const { nome, escudo, categorias_ids } = req.body;
  try {
    const time = await prisma.time.create({ 
      data: { 
        nome, 
        escudo,
        categorias: categorias_ids ? {
          connect: categorias_ids.map((id: number) => ({ id }))
        } : undefined
      },
      include: { categorias: true }
    });
    res.status(201).json(time);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar time' });
  }
});

app.patch('/times/:id', async (req, res) => {
  const { nome, escudo, categorias_ids } = req.body;
  try {
    const time = await prisma.time.update({
      where: { id: Number(req.params.id) },
      data: { 
        nome, 
        escudo,
        categorias: categorias_ids ? {
          set: categorias_ids.map((id: number) => ({ id })) 
        } : undefined
      },
      include: { categorias: true }
    });
    res.json(time);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar time' });
  }
});

app.get('/times', async (req, res) => {
  try {
    const times = await prisma.time.findMany({ 
      orderBy: { nome: 'asc' },
      include: { categorias: true } 
    });
    res.json(times);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar times' });
  }
});

app.delete('/times/:id', async (req, res) => {
  try {
    await prisma.time.delete({ where: { id: Number(req.params.id) } });
    res.json({ mensagem: 'Time excluído' });
  } catch (error) {
    res.status(409).json({ error: 'Time possui partidas vinculadas e não pode ser excluído.' });
  }
});

app.patch('/competicoes/:id', async (req, res) => {
  const { nome, ano } = req.body;
  try {
    const competicao = await prisma.competicao.update({
      where: { id: Number(req.params.id) },
      data: { nome, ano },
    });
    res.json(competicao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar competição' });
  }
});

app.delete('/competicoes/:id', async (req, res) => {
  try {
    await prisma.competicao.delete({ where: { id: Number(req.params.id) } });
    res.json({ mensagem: 'Competição excluída' });
  } catch (error) {
    res.status(409).json({ error: 'Competição possui partidas vinculadas.' });
  }
});

app.post('/jogadores', async (req, res) =>{
  const { nome, cpf, dtNasc, posicao, numCamisa} = req.body;

  if (!nome || !cpf || !dtNasc){
    return res.status(400).json({ error: 'Nome, CPF e data de nascimento são obrigatórios' });
  }

  try {
    const cpfExistente = await prisma.jogador.findUnique({ where: { cpf} });
    if (cpfExistente) {
      return res.status(409).json({
        error: 'Este CPF já está cadastrado'
      })
    }

    const anoNasc = new Date(dtNasc).getFullYear();
    const anoAtual = new Date().getFullYear();
    const idadeNoAno = anoAtual - anoNasc;

    const regrasCategorias = [
      {limite: 7, nome: "sub-7"},
      {limite: 8, nome: "sub-8"},
      {limite: 9, nome: "sub-9"},
      {limite: 10, nome: "sub-10"},
      {limite: 12, nome: "sub-12"},
      {limite: 14, nome: "sub-14"},
      {limite: 16, nome: "sub-16"},
      {limite: 18, nome: "sub-18"},
    ];

    const categoriaAdequada = regrasCategorias.find(regra => idadeNoAno <= regra.limite);

    if (!categoriaAdequada) {
        return res.status(403).json({ error: 'Idade não permitida. O clube não registra atletas acima de 18 anos.' });
    }

    const nomeCategoria = categoriaAdequada.nome;

    const categoria = await prisma.categoria.findFirst({
      where: {nome: nomeCategoria}
    });

    if (!categoria){
      return res.status(404).json({ error: `Categoria ${nomeCategoria} não encontrada`});
    }

    if (numCamisa){
      const camisaEmUso = await prisma.jogador.findFirst({
        where: {
          categoria_id: categoria.id,
          numCamisa: Number(numCamisa)
        }
      });

      if (camisaEmUso){
        return res.status(409).json({
          error: `A camisa ${numCamisa} já está sendo usada pelo jogador ${camisaEmUso.nome} na categoria ${nomeCategoria}.`
        });
      }
    }

    const jogador = await prisma.jogador.create({
      data: {
        nome,
        cpf,
        dtNasc: new Date(dtNasc),
        posicao: posicao ||  "Ala", // Valor default para futsal
        numCamisa: numCamisa ? Number(numCamisa) : null,
        categoria_id: categoria.id,
        perfil_ml: ""
      }
    });

    return res.status(201).json(jogador);
    
  } catch (error) {
    console.error("Erro ao cadastrar Jogador: ", error);
    res.status(500).json({ error: 'Erro ao criar jogador' }); 
  }
});

app.get('/jogadores', async (req, res) => {
    try {
        const jogadores = await prisma.jogador.findMany();
        res.json(jogadores);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.get('/jogadores/perfis', async (req, res) => {
  const { categoria_id } = req.query;
  try {
    const jogadores = await prisma.jogador.findMany({
      where: categoria_id ? { categoria_id: Number(categoria_id) } : undefined,
      include: {
        eventos: true,
        categoria: true,
        escalacoes: true // Conta os jogos disputados a partir das escalações
      },
      orderBy: { nota_geral: 'desc' },
    });

    const formatados = jogadores.map(j => {
      const stats = j.eventos.reduce((acc: any, ev) => {
        acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
        return acc;
      }, {});

      const jogos = j.escalacoes ? j.escalacoes.length : 0;

      return {
        id_jogador:       j.id,
        nome:             j.nome,
        posicao:          j.posicao,
        numCamisa:        j.numCamisa,
        dtNasc:           j.dtNasc,
        perfil_ml:        j.perfil_ml || 'Sem dados',
        scores_ml:        j.scores_ml,
        nota_geral:       j.nota_geral ?? 0,
        categoria:        j.categoria.nome,
        categoria_tipo:   j.categoria.tipo,
        categoria_id:     j.categoria_id,
        time:             'CFA Ocian',
        jogos_disputados: jogos,
        gols:             stats['GOL']             || 0,
        assistencias:     stats['ASSISTENCIA']     || 0,
        defesas:          stats['DEFESA']          || 0,
        cartoes_amarelos: stats['CARTAO_AMARELO']  || 0,
        cartoes_vermelhos:stats['CARTAO_VERMELHO'] || 0,
        faltas_cometidas: stats['FALTA']           || 0,
      };
    });

    res.json(formatados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar perfis' });
  }
});

app.post('/competicoes', async (req, res) => {
  const { nome, ano } = req.body;
  try {
    const competicao = await prisma.competicao.create({ data: { nome, ano } });
    res.status(201).json(competicao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar competição' });
  }
});

app.get('/competicoes', async (req, res) => {
  try {
    const competicoes = await prisma.competicao.findMany({ orderBy: { nome: 'asc' } });
    res.json(competicoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar competições' });
  }
});

app.post('/partidas', async (req, res) => {
  const { mandante_id, visitante_id, data, horario, local, emCasa, categoria_id, competicao_id } = req.body;
  try {
    const partida = await prisma.partida.create({
      data: {
        mandante_id,
        visitante_id,
        data: data ? new Date(data) : new Date(),
        horario,
        local,
        emCasa,
        categoria_id,
        competicao_id,
        status: 'AGENDADA',
      },
      include: { mandante: true, visitante: true, categoria: true, competicao: true },
    });
    res.status(201).json(partida);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar partida' });
  }
});

app.get('/categorias', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

app.get('/partidas', async (req, res) => {
  const { categoria_id, mes, status } = req.query;
  try {
    const where: any = {};
    if (categoria_id) where.categoria_id = Number(categoria_id);
    if (status) where.status = status;
    if (mes) {
      const ano = new Date().getFullYear();
      where.data = {
        gte: new Date(`${ano}-${String(mes).padStart(2, '0')}-01`),
        lt:  new Date(`${ano}-${String(Number(mes) + 1).padStart(2, '0')}-01`),
      };
    }
    const partidas = await prisma.partida.findMany({
      where,
      orderBy: { data: 'asc' },
      include: { mandante: true, visitante: true, categoria: true, eventos: true },
    });
    res.json(partidas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar partidas' });
  }
});

// ==========================================
// 3. O JOGO E EVENTOS
// ==========================================

app.get('/jogadores/:id/estatisticas', async (req, res) => {
    const jogadorId = parseInt(req.params.id);
    const estatisticas = await prisma.evento.groupBy({
        by: ['tipo'],
        where: { jogador_id: jogadorId },
        _count: { tipo: true }
    });

    const formatado = estatisticas.reduce((acc: any, curr: any) => {
        acc[curr.tipo] = curr._count.tipo;
        return acc;
    }, {});

    res.json({ jogador_id: jogadorId, estatisticas: formatado });
});

app.post('/partidas/:id/eventos', async (req, res) => {
    const partidaId = parseInt(req.params.id);
    const { jogador_id, time_id, tipo, minuto } = req.body;
    try {
        const evento = await prisma.evento.create({
            data: { partida_id: partidaId, jogador_id, time_id, tipo, minuto },
            include: { jogador: true }
        });

        io.emit('evento_partida', {
            tipo: evento.tipo,
            jogador: evento.jogador?.nome || 'Adversário',
            minuto: evento.minuto,
            partida_id: partidaId
        });

        res.status(201).json(evento);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar evento' });
    }
});

app.patch('/partidas/:id/placar', async (req, res) => {
  const { gols_mandante, gols_visitante } = req.body;
  try {
    const partida = await prisma.partida.update({
      where: { id: Number(req.params.id) },
      data: { gols_mandante, gols_visitante },
    });
    io.emit('placar_atualizado', partida);
    res.json(partida);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar placar' });
  }
});

app.patch('/partidas/:id/status', async (req, res) => {
    const partidaId = parseInt(req.params.id);
    const { status } = req.body;
    try {
        const partida = await prisma.partida.update({
            where: { id: partidaId },
            data: { status }
        });
        if (status === 'FINALIZADA') {
            processarMachineLearning().catch(err => console.error("Erro na IA:", err));
        }
        res.json(partida);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ==========================================
// 4. INTEGRAÇÃO COM IA
// ==========================================

async function processarMachineLearning() {
  const jogadores = await prisma.jogador.findMany({
    include: { 
      eventos: true,
      escalacoes: true // Fundamental para contabilizar a quantidade correta de jogos
    }
  });

  const payload = jogadores
    .map(j => {
      const stats = j.eventos.reduce((acc: any, ev) => {
        acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
        return acc;
      }, {});

      // O jogador só vai pra IA se tiver sido escalado (jogado) ao menos 1 vez
      const jogos = j.escalacoes ? j.escalacoes.length : 0;
      if (jogos === 0) return null;

      return {
        jogador_id: j.id,
        GOL:            stats['GOL']            || 0,
        ASSISTENCIA:    stats['ASSISTENCIA']    || 0,
        DEFESA:         stats['DEFESA']         || 0, // <-- ATUALIZADO AQUI: Substituiu DESARME
        CARTAO_AMARELO: stats['CARTAO_AMARELO'] || 0,
        CARTAO_VERMELHO:stats['CARTAO_VERMELHO']|| 0,
        FALTA:          stats['FALTA']          || 0,
        jogos_disputados: jogos,
      };
    })
    .filter(Boolean);

  // K-Means não funciona sem no mínimo 3 pontos no gráfico
  if (payload.length < 3) {
    console.log("Scout IA: Jogadores insuficientes para calcular perfis.");
    return;
  }

  try {
    const resposta = await axios.post(`${PYTHON_AI_URL}/internal/ml/treinar-perfis`, payload);
    for (const resultado of resposta.data) {
      await prisma.jogador.update({
        where: { id: resultado.jogador_id },
        data: {
          perfil_ml:  resultado.perfil_ml,
          scores_ml:  resultado.scores,
          nota_geral: resultado.nota_geral,
        },
      });
    }
    console.log(`Scout IA: ${resposta.data.length} jogadores processados e atualizados.`);
  } catch (error) {
    console.error("Falha ao comunicar com microsserviço de IA Python.");
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Core Service rodando na porta ${PORT}`);
});