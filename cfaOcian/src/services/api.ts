export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export async function fetchTimes() {
  const res = await fetch(`${BASE_URL}/times`);
  if (!res.ok) throw new Error('Erro ao buscar times');
  return res.json();
}

export async function fetchCompeticoes() {
  const res = await fetch(`${BASE_URL}/competicoes`);
  if (!res.ok) throw new Error('Erro ao buscar competicoes');
  return res.json();
}

export async function fetchPartidas(params?: {
  categoria_id?: number;
  mes?: number;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.categoria_id) query.append('categoria_id', String(params.categoria_id));
  if (params?.mes) query.append('mes', String(params.mes));
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`${BASE_URL}/partidas?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar partidas');
  return res.json();
}

export async function criarPartida(dados: {
  mandante_id: number;
  visitante_id: number;
  data: string;
  horario: string;
  local: string;
  emCasa: boolean;
  categoria_id: number;
  competicao_id?: number; // <-- Adicionado como opcional
}) {
  const res = await fetch(`${BASE_URL}/partidas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar partida');
  return res.json();
}