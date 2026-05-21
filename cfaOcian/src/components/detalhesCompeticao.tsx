// cfaOcian/src/components/DetalhesCompeticao.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  Pressable, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Header } from '@/src/components/Header';
import OrganizarPartidaCampeonato from '@/src/components/organizarPartidaCampeonato';
import { fetchPartidasPorCompeticao, fetchJogadoresPorCompeticao, atualizarStatusPartida } from '@/src/services/api';

interface Competicao { id: number; nome: string; ano: number; tipo: 'INICIACAO' | 'BASE'; }
interface Time { id: number; nome: string; escudo: string | null; categoria_id: number; }

interface Evento {
  id: number;
  tipo: 'GOL' | 'ASSISTENCIA' | 'DEFESA' | 'CARTAO_AMARELO' | 'CARTAO_VERMELHO' | 'FALTA';
  minuto: number;
  doOcian: boolean;
  jogador_id: number | null;
  jogador: { id: number; nome: string } | null;
}

interface Partida {
  id: number; rodada: number | null; grupo: string | null;
  data: string; horario: string | null; local: string | null;
  status: string; emCasa: boolean;
  mandante: Time; visitante: Time;
  categoria: { id: number; nome: string };
  gols_mandante: number; gols_visitante: number;
  eventos: Evento[];
}

interface Jogador {
  id: number; nome: string; posicao: string;
  numCamisa: number | null; categoria_id: number;
}

interface Props {
  competicao: Competicao;
  onFechar: () => void;
}

const STATUS_OPCOES = ['AGENDADA', 'PREPARADA', 'AO_VIVO', 'FINALIZADA', 'CANCELADA'] as const;

const STATUS_COR: Record<string, string> = {
  AGENDADA: colors.azulClaro,
  PREPARADA: '#a855f7',
  AO_VIVO: '#22c55e',
  FINALIZADA: colors.text_secondary,
  CANCELADA: colors.vermelho,
};

const STATUS_LABEL: Record<string, string> = {
  AGENDADA: 'Agendada',
  PREPARADA: 'Preparada',
  AO_VIVO: 'Ao Vivo',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const TIPO_ICONE: Record<string, string> = {
  GOL: 'soccer',
  ASSISTENCIA: 'shoe-cleat',
  DEFESA: 'shield-check',
  CARTAO_AMARELO: 'card',
  CARTAO_VERMELHO: 'card',
  FALTA: 'hand-back-right',
};

const TIPO_COR: Record<string, string> = {
  GOL: '#22c55e',
  ASSISTENCIA: colors.azulClaro,
  DEFESA: '#a855f7',
  CARTAO_AMARELO: '#eab308',
  CARTAO_VERMELHO: colors.vermelho,
  FALTA: '#f97316',
};

const TIPO_LABEL: Record<string, string> = {
  GOL: 'Gols',
  ASSISTENCIA: 'Assist.',
  DEFESA: 'Defesas',
  CARTAO_AMARELO: 'Amarelos',
  CARTAO_VERMELHO: 'Vermelhos',
  FALTA: 'Faltas',
};

function formatarData(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('T')[0].split('-');
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
}

function isHoje(dataStr: string): boolean {
  const hoje = new Date();
  const [ano, mes, dia] = dataStr.split('T')[0].split('-');
  return (
    hoje.getFullYear() === Number(ano) &&
    hoje.getMonth() + 1 === Number(mes) &&
    hoje.getDate() === Number(dia)
  );
}

// Agrupa eventos por jogador e conta cada tipo
function calcularStatsJogadores(eventos: Evento[]) {
  const mapa: Record<number, { nome: string; stats: Record<string, number> }> = {};
  eventos.forEach(ev => {
    if (!ev.doOcian || !ev.jogador) return;
    if (!mapa[ev.jogador.id]) mapa[ev.jogador.id] = { nome: ev.jogador.nome, stats: {} };
    mapa[ev.jogador.id].stats[ev.tipo] = (mapa[ev.jogador.id].stats[ev.tipo] || 0) + 1;
  });
  return Object.entries(mapa).map(([id, val]) => ({ id: Number(id), ...val }));
}

export default function DetalhesCompeticao({ competicao, onFechar }: Props) {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [catFiltro, setCatFiltro] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalStatus, setModalStatus] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const [p, j] = await Promise.all([
        fetchPartidasPorCompeticao(competicao.id),
        fetchJogadoresPorCompeticao(competicao.id),
      ]);
      setPartidas(p);
      setJogadores(j);
      const cats = Array.from(
        new Map(p.map((x: Partida) => [x.categoria.id, x.categoria])).values()
      ) as { id: number; nome: string }[];
      setCategorias(cats.sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
    } catch (e) {
      console.error(e);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, [competicao.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const partidasFiltradas = catFiltro
    ? partidas.filter(p => p.categoria.id === catFiltro)
    : partidas;

  const porRodada = partidasFiltradas.reduce((acc: Record<string, Partida[]>, p) => {
    const chave = p.rodada
      ? `Rodada ${p.rodada}${p.grupo ? ` • Grupo ${p.grupo}` : ''}`
      : 'Sem rodada';
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(p);
    return acc;
  }, {});

  const atualizarStatus = async (novoStatus: string) => {
    if (!partidaSelecionada) return;
    setAtualizandoStatus(true);
    try {
      await atualizarStatusPartida(partidaSelecionada.id, novoStatus);
      const atualizada = { ...partidaSelecionada, status: novoStatus };
      setPartidaSelecionada(atualizada);
      setModalStatus(false);
      carregar(true);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const jogadoresDaPartida = partidaSelecionada
    ? jogadores.filter(j => j.categoria_id === partidaSelecionada.categoria.id)
    : [];

  const statsJogadores = partidaSelecionada
    ? calcularStatsJogadores(partidaSelecionada.eventos ?? [])
    : [];

  const temStats = statsJogadores.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title={competicao.nome}
        showLogo={false} showProfile={false}
        btnVoltar="arrow-left" onBtnVoltar={onFechar}
      />

      {/* Filtro categorias */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16,paddingVertical: 8, gap: 8 }}
      >
        {[{ id: null, nome: 'TODOS' }, ...categorias].map(cat => (
          <TouchableOpacity
            key={cat.id ?? 'todos'}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: catFiltro === cat.id ? colors.primary : '#1a1a1a',
              borderWidth: 1, borderColor: catFiltro === cat.id ? colors.primary : '#333',
            }}
            onPress={() => setCatFiltro(cat.id)}
          >
            <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 12 }}>
              {cat.nome.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregando ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : partidas.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <MaterialCommunityIcons name="calendar-remove-outline" size={56} color="#2a2a2a" />
          <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Regular' }}>
            Nenhuma partida importada ainda.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}>
          {Object.entries(porRodada).map(([rodada, jogos]) => (
            <View key={rodada}>
              <Text style={{ color: colors.azulClaro, fontFamily: 'Creato-Bold', fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>
                {rodada.toUpperCase()}
              </Text>
              <View style={{ gap: 8 }}>
                {jogos.map(partida => {
                  const podePrepararCard = partida.status === 'AGENDADA' && isHoje(partida.data);
                  return (
                    <TouchableOpacity
                      key={partida.id}
                      style={{
                        backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14,
                        borderWidth: 1, borderColor: podePrepararCard ? '#a855f722' : '#252525',
                      }}
                      onPress={() => { setPartidaSelecionada(partida); setModalDetalhes(true); }}
                      activeOpacity={0.8}
                    >
                      {/* Cabeçalho do card */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Bold', fontSize: 11 }}>
                          {partida.categoria.nome.toUpperCase()}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_COR[partida.status] ?? colors.azulClaro }} />
                          <Text style={{ color: STATUS_COR[partida.status] ?? colors.azulClaro, fontFamily: 'Creato-Bold', fontSize: 11 }}>
                            {STATUS_LABEL[partida.status] ?? partida.status}
                          </Text>
                        </View>
                      </View>

                      {/* Placar */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 14, flex: 1 }} numberOfLines={2}>
                          {partida.mandante.nome}
                        </Text>
                        <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
                          {partida.status === 'FINALIZADA' || partida.status === 'AO_VIVO' ? (
                            <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 22 }}>
                              {partida.gols_mandante} - {partida.gols_visitante}
                            </Text>
                          ) : (
                            <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Bold', fontSize: 16 }}>
                              —
                            </Text>
                          )}
                          <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Regular', fontSize: 11 }}>
                            {partida.horario ?? '--:--'} • {formatarData(partida.data)}
                          </Text>
                        </View>
                        <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 14, flex: 1, textAlign: 'right' }} numberOfLines={2}>
                          {partida.visitante.nome}
                        </Text>
                      </View>

                      {partida.local && (
                        <Text style={{ color: '#444', fontFamily: 'Creato-Regular', fontSize: 11, marginTop: 8 }} numberOfLines={1}>
                           {partida.local}
                        </Text>
                      )}

                      {/* Botão PREPARAR — só aparece no dia do jogo */}
                      {podePrepararCard && (
                        <TouchableOpacity
                          style={{
                            marginTop: 10, backgroundColor: '#a855f722', borderRadius: 8,
                            padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#a855f7',
                            flexDirection: 'row', justifyContent: 'center', gap: 6,
                          }}
                          onPress={() => { setPartidaSelecionada(partida); setModalDetalhes(true); }}
                        >
                          <MaterialCommunityIcons name="clipboard-list-outline" size={16} color="#a855f7" />
                          <Text style={{ color: '#a855f7', fontFamily: 'Creato-Bold', fontSize: 13 }}>
                            PREPARAR PARTIDA
                          </Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── MODAL DETALHES DA PARTIDA ── */}
      <Modal visible={modalDetalhes} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }} onPress={() => setModalDetalhes(false)}/> 
          <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' }}>
            {/* Indicador de arrasto */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#333' }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
              {partidaSelecionada && (
                <>
                  {/* Título */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 15 }}>
                      {partidaSelecionada.categoria.nome}
                      {partidaSelecionada.rodada ? ` • Rodada ${partidaSelecionada.rodada}` : ''}
                      {partidaSelecionada.grupo ? ` • Grupo ${partidaSelecionada.grupo}` : ''}
                    </Text>
                    <TouchableOpacity onPress={() => setModalDetalhes(false)}>
                      <MaterialCommunityIcons name="close" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Placar grande */}
                  <View style={{ backgroundColor: '#131313', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 14, flex: 1, textAlign: 'center' }} numberOfLines={2}>
                        {partidaSelecionada.mandante.nome}
                      </Text>

                      <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
                        {partidaSelecionada.status === 'FINALIZADA' || partidaSelecionada.status === 'AO_VIVO' ? (
                          <Text style={{ color: colors.primary, fontFamily: 'Creato-Bold', fontSize: 32 }}>
                            {partidaSelecionada.gols_mandante} × {partidaSelecionada.gols_visitante}
                          </Text>
                        ) : (
                          <Text style={{ color: '#333', fontFamily: 'Creato-Bold', fontSize: 28 }}>— × —</Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_COR[partidaSelecionada.status] }} />
                          <Text style={{ color: STATUS_COR[partidaSelecionada.status], fontFamily: 'Creato-Bold', fontSize: 11 }}>
                            {STATUS_LABEL[partidaSelecionada.status]}
                          </Text>
                        </View>
                      </View>

                      <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 14, flex: 1, textAlign: 'center' }} numberOfLines={2}>
                        {partidaSelecionada.visitante.nome}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                      <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Regular', fontSize: 12 }}>
                         {formatarData(partidaSelecionada.data)}
                      </Text>
                      {partidaSelecionada.horario && (
                        <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Regular', fontSize: 12 }}>
                           {partidaSelecionada.horario}
                        </Text>
                      )}
                      {partidaSelecionada.local && (
                        <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Regular', fontSize: 12 }} numberOfLines={1}>
                           {partidaSelecionada.local}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Estatísticas — só se FINALIZADA e tiver eventos */}
                  {partidaSelecionada.status === 'FINALIZADA' && temStats && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ color: colors.azulClaro, fontFamily: 'Creato-Bold', fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>
                        ESTATÍSTICAS DO OCIAN
                      </Text>
                      {statsJogadores.map(j => {
                        const tiposComValor = Object.entries(j.stats).filter(([, v]) => v > 0);
                        if (tiposComValor.length === 0) return null;
                        return (
                          <View key={j.id} style={{ backgroundColor: '#131313', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                            <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 13, marginBottom: 8 }}>
                              {j.nome.split(' ')[0]}
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                              {tiposComValor.map(([tipo, valor]) => (
                                <View key={tipo} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: TIPO_COR[tipo] + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                  <MaterialCommunityIcons name={TIPO_ICONE[tipo] as any} size={12} color={TIPO_COR[tipo]} />
                                  <Text style={{ color: TIPO_COR[tipo], fontFamily: 'Creato-Bold', fontSize: 12 }}>
                                    {valor} {TIPO_LABEL[tipo]}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Convocados */}
                  {jogadoresDaPartida.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ color: colors.azulClaro, fontFamily: 'Creato-Bold', fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>
                        CONVOCADOS ({jogadoresDaPartida.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {jogadoresDaPartida.map(j => (
                            <View key={j.id} style={{ backgroundColor: '#252525', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 72 }}>
                              <Text style={{ color: colors.primary, fontFamily: 'Creato-Bold', fontSize: 16 }}>
                                #{j.numCamisa ?? '—'}
                              </Text>
                              <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 11, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
                                {j.nome.split(' ')[0]}
                              </Text>
                              <Text style={{ color: colors.text_secondary, fontFamily: 'Creato-Regular', fontSize: 10 }}>
                                {j.posicao}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* Ações */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: '#252525', borderRadius: 10, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                      onPress={() => { setModalDetalhes(false); setModalEditar(true); }}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.azulClaro} />
                      <Text style={{ color: colors.azulClaro, fontFamily: 'Creato-Bold', fontSize: 13 }}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1, borderRadius: 10, padding: 12,
                        alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                        backgroundColor: STATUS_COR[partidaSelecionada.status] + '22',
                        borderWidth: 1, borderColor: STATUS_COR[partidaSelecionada.status],
                      }}
                      onPress={() => setModalStatus(true)}
                    >
                      <MaterialCommunityIcons name="swap-horizontal" size={18} color={STATUS_COR[partidaSelecionada.status]} />
                      <Text style={{ color: STATUS_COR[partidaSelecionada.status], fontFamily: 'Creato-Bold', fontSize: 13 }}>
                        {STATUS_LABEL[partidaSelecionada.status]}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botão PREPARAR — dentro do modal */}
                  {partidaSelecionada.status === 'AGENDADA' && isHoje(partidaSelecionada.data) && (
                    <TouchableOpacity
                      style={{
                        marginTop: 10, backgroundColor: '#a855f722', borderRadius: 10,
                        padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#a855f7',
                        flexDirection: 'row', justifyContent: 'center', gap: 8,
                      }}
                      onPress={() => {
                        setModalDetalhes(false);
                        // Aqui vai navegar para a tela de Preparar Partida (próximo passo)
                        Alert.alert('Em breve', 'Tela de preparação da partida em desenvolvimento.');
                      }}
                    >
                      <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#a855f7" />
                      <Text style={{ color: '#a855f7', fontFamily: 'Creato-Bold', fontSize: 14 }}>
                        PREPARAR PARTIDA
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL STATUS ── */}
      <Modal visible={modalStatus} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setModalStatus(false)}
        >
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, width: '80%', gap: 8 }}>
            <Text style={{ color: colors.text, fontFamily: 'Creato-Bold', fontSize: 16, marginBottom: 8 }}>
              Alterar Status
            </Text>
            {STATUS_OPCOES.map(s => (
              <TouchableOpacity
                key={s}
                style={{
                  padding: 14, borderRadius: 10,
                  backgroundColor: partidaSelecionada?.status === s ? STATUS_COR[s] + '33' : '#252525',
                  borderWidth: 1, borderColor: partidaSelecionada?.status === s ? STATUS_COR[s] : 'transparent',
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}
                onPress={() => atualizarStatus(s)}
                disabled={atualizandoStatus}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COR[s] }} />
                <Text style={{ color: STATUS_COR[s], fontFamily: 'Creato-Bold', fontSize: 14, flex: 1 }}>
                  {STATUS_LABEL[s]}
                </Text>
                {atualizandoStatus && (
                  <ActivityIndicator size="small" color={STATUS_COR[s]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── MODAL EDITAR PARTIDA ── */}
      <Modal visible={modalEditar} transparent={false} animationType="slide">
        {partidaSelecionada && (
          <OrganizarPartidaCampeonato
            competicao={competicao}
            partida={partidaSelecionada}
            onFechar={() => setModalEditar(false)}
            onSalvo={() => { setModalEditar(false); carregar(true); }}
          />
        )}
      </Modal>
    </View>
  );
}