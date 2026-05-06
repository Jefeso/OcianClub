import * as SecureStore from 'expo-secure-store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

async function getToken() {
  return await SecureStore.getItemAsync('userToken');
}

export async function fetchTimes() {
  const res = await fetch(`${BASE_URL}/times`);
  if (!res.ok) throw new Error('Erro ao buscar times');
  return res.json();
}

export async function criarTime(dados: { nome: string; escudo?: string }) {
  const res = await fetch(`${BASE_URL}/times`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar time');
  return res.json();
}

export async function atualizarTime(id: number, dados: { nome: string; escudo?: string }) {
  const res = await fetch(`${BASE_URL}/times/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao atualizar time');
  return res.json();
}

export async function deletarTime(id: number) {
  const res = await fetch(`${BASE_URL}/times/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const dados = await res.json();
    throw new Error(dados.error ?? 'Erro ao excluir time');
  }
  return res.json();
}

export async function criarCompeticao(dados: { nome: string; ano: number }) {
  const res = await fetch(`${BASE_URL}/competicoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar competição');
  return res.json();
}

export async function atualizarCompeticao(id: number, dados: { nome: string; ano: number }) {
  const res = await fetch(`${BASE_URL}/competicoes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao atualizar competição');
  return res.json();
}

export async function deletarCompeticao(id: number) {
  const res = await fetch(`${BASE_URL}/competicoes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const dados = await res.json();
    throw new Error(dados.error ?? 'Erro ao excluir competição');
  }
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
  competicao_id?: number;
}) {
  const res = await fetch(`${BASE_URL}/partidas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar partida');
  return res.json();
}

export async function atualizarUsuario(dados: { nome: string; email: string; senha?: string }) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/usuarios/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao atualizar dados');
  return res.json();
}

export async function excluirConta() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/usuarios/me`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Erro ao excluir conta');
  return res.json();
}