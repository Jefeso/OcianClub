import * as SecureStore from 'expo-secure-store';

// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ocianclub-node.onrender.com';

async function getToken() {
  return await SecureStore.getItemAsync('userToken');
}

export async function fetchJogadoresPorCompeticao(comp_id: number): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/competicoes/${comp_id}/jogadores`);
  if (!res.ok) throw new Error('Erro ao buscar elenco do campeonato');
  return res.json();
}

// Substitui o elenco de uma competição por completo (idempotente).
export async function salvarElencoCompeticao(comp_id: number, jogador_ids: number[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/competicoes/${comp_id}/jogadores`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jogador_ids }),
  });
  if (!res.ok) throw new Error('Erro ao salvar elenco da competição');
}

export async function fetchJogadoresPerfis(categoria_id?: number): Promise<any[]> {
  const query = categoria_id ? `?categoria_id=${categoria_id}` : '';
  const res = await fetch(`${BASE_URL}/jogadores/perfis${query}`);
  if (!res.ok) throw new Error('Erro ao buscar perfis');
  return res.json();
}

export async function fetchTimes() {
  const res = await fetch(`${BASE_URL}/times`);
  if (!res.ok) throw new Error('Erro ao buscar times');
  return res.json();
}

export async function criarTime(dados: { nome: string; escudo?: string; categorias_ids?: number[] }) {
  const res = await fetch(`${BASE_URL}/times`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar time');
  return res.json();
}

export async function atualizarTime(id: number, dados: { nome: string; escudo?: string; categorias_ids?: number[] }) {
  const res = await fetch(`${BASE_URL}/times/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao atualizar time');
  return res.json();
}

export async function fetchCategorias() {
  const res = await fetch(`${BASE_URL}/categorias`);
  if (!res.ok) throw new Error('Erro ao buscar categorias');
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

export async function fetchJogadores() {
  const res = await fetch(`${BASE_URL}/jogadores`);
  if (!res.ok) throw new Error('Erro ao buscar jogadores');
  return res.json();
}

export async function criarJogador(dados: {
  nome: string; cpf: string; dtNasc: string; posicao: string; numCamisa?: number;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/jogadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao criar jogador');
  return json;
}

export async function atualizarJogador(id: number, dados: any) {
  const res = await fetch(`${BASE_URL}/jogadores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao atualizar jogador');
  }
  return res.json();
}

export async function deletarJogador(id: number) {
  const res = await fetch(`${BASE_URL}/jogadores/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao deletar jogador');
  }
  return res.json();
}

export async function fetchPerfilJogador(id: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/jogadores/perfis?categoria_id=0`);
  if (!res.ok) throw new Error('Erro ao buscar perfil');
  const todos = await res.json();
  return todos.find((j: any) => j.id_jogador === id) ?? null;
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

export async function fetchPartidasPorCompeticao(competicao_id: number, categoria_id?: number) {
  const query = new URLSearchParams({ competicao_id: String(competicao_id) });
  if (categoria_id) query.append('categoria_id', String(categoria_id));
  const res = await fetch(`${BASE_URL}/partidas?${query}`);
  if (!res.ok) throw new Error('Erro ao buscar partidas da competição');
  return res.json();
}

export async function atualizarStatusPartida(id: number, status: string) {
  const res = await fetch(`${BASE_URL}/partidas/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status');
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
  rodada? : number;
  grupo?: string;
}) {
  const res = await fetch(`${BASE_URL}/partidas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar partida');
  return res.json();
}

export async function atualizarPartida(id: number, dados: {
  mandante_id?: number; visitante_id?: number; data?: string;
  horario?: string; local?: string; emCasa?: boolean;
  rodada?: number; grupo?: string; categoria_id?: number;
}) {
  const res = await fetch(`${BASE_URL}/partidas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao atualizar partida'); }
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