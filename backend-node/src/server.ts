// src/server.ts
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
    const { email, senha, role } = req.body;
    try {
        const hashSenha = await bcrypt.hash(senha, 10);
        const usuario = await prisma.usuario.create({
            data: { email, senha: hashSenha, role }
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
    res.json({ token, role: usuario.role });
});

// ==========================================
// 2. CADASTROS E BUSCAS
// ==========================================

app.post('/jogadores', async (req, res) => {
    const { nome, posicao, categoria_id } = req.body;
    try {
        const jogador = await prisma.jogador.create({
            data: { nome, posicao, categoria_id }
        });
        res.status(201).json(jogador);
    } catch (error) {
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

// NOVA ROTA: PERFIS E ESTATÍSTICAS PARA O FRONTEND
app.get('/jogadores/perfis', async (req, res) => {
    try {
        // Busca jogadores e seus eventos
        const jogadores = await prisma.jogador.findMany({
            include: { eventos: true }
        });

        const formatados = jogadores.map(j => {
            // Conta os eventos por tipo para este jogador específico
            const stats = j.eventos.reduce((acc: any, ev) => {
                acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
                return acc;
            }, {});

            return {
                id_jogador: j.id,
                nome: j.nome,
                posicao: j.posicao,
                perfil_ml: j.perfil_ml || 'Versátil',
                foto: j.foto || null,
                time: "CFA Ocian",
                jogos_disputados: [...new Set(j.eventos.map(e => e.partida_id))].length,
                gols: stats['GOL'] || 0,
                assistencias: stats['ASSISTENCIA'] || 0,
                desarmes: stats['DESARME'] || 0,
                cartoes_amarelos: stats['CARTAO_AMARELO'] || 0,
                cartoes_vermelhos: stats['CARTAO_VERMELHO'] || 0,
                faltas_cometidas: stats['FALTA'] || 0
            };
        });

        res.json(formatados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar perfis de estatísticas' });
    }
});

app.post('/partidas', async (req, res) => {
    const { adversario } = req.body;
    try {
        const partida = await prisma.partida.create({
            data: { adversario, status: 'AGENDADA' }
        });
        res.status(201).json(partida);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar partida' });
    }
});

app.get('/partidas', async (req, res) => {
    try {
        const partidas = await prisma.partida.findMany({ orderBy: { data: 'desc' } });
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
    const { jogador_id, tipo, minuto } = req.body;
    try {
        const evento = await prisma.evento.create({
            data: { partida_id: partidaId, jogador_id, tipo, minuto },
            include: { jogador: true }
        });

        io.emit('evento_partida', {
            tipo: evento.tipo,
            jogador: evento.jogador.nome,
            minuto: evento.minuto,
            partida_id: partidaId
        });

        res.status(201).json(evento);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar evento' });
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
    console.log("Coletando dados para IA...");
    const eventos = await prisma.evento.groupBy({
        by: ['jogador_id', 'tipo'],
        _count: { tipo: true }
    });

    const mapJogadores = new Map<number, any>();
    for (const ev of eventos) {
        if (!mapJogadores.has(ev.jogador_id)) {
            mapJogadores.set(ev.jogador_id, { jogador_id: ev.jogador_id, GOL: 0, ASSISTENCIA: 0, DESARME: 0, CARTAO_AMARELO: 0, CARTAO_VERMELHO: 0 });
        }
        const dados = mapJogadores.get(ev.jogador_id);
        dados[ev.tipo] = ev._count.tipo;
    }

    const payload = Array.from(mapJogadores.values());
    if(payload.length < 3) return;

    try {
        const resposta = await axios.post(`${PYTHON_AI_URL}/internal/ml/treinar-perfis`, payload);
        for (const perfil of resposta.data) {
            await prisma.jogador.update({
                where: { id: perfil.jogador_id },
                data: { perfil_ml: perfil.perfil_ml }
            });
        }
    } catch (error) {
        console.error("Falha ao comunicar com IA.");
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Core Service rodando na porta ${PORT}`);
});