import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { styles } from './jogosStyles';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPartidas } from '@/src/services/api';
import OrganizarPartidas from '../organizarPartidas/organizarPartidas';

const FILTROS_MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const FILTROS_CAT = ['Todas', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18'];

interface Time { id: number; nome: string; escudo: string | null; }
interface Partida {
  id: number;
  mandante: Time;
  visitante: Time;
  gols_mandante: number;
  gols_visitante: number;
  data: string;
  horario: string | null;
  local: string | null;
  status: 'AGENDADA' | 'AO_VIVO' | 'FINALIZADA';
  emCasa: boolean;
  categoria: { id: number; nome: string } | null;
}
interface DiaJogo { data: string; partidas: Partida[]; }

function agruparPorDia(partidas: Partida[]): DiaJogo[] {
  const mapa = new Map<string, Partida[]>();
  for (const p of partidas) {
    const data = new Date(p.data);
    const chave = data.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    const chaveCapitalizada = chave.charAt(0).toUpperCase() + chave.slice(1);
    if (!mapa.has(chaveCapitalizada)) mapa.set(chaveCapitalizada, []);
    mapa.get(chaveCapitalizada)!.push(p);
  }
  return Array.from(mapa.entries()).map(([data, partidas]) => ({ data, partidas }));
}

function isOcian(time: Time) {
  return time.nome.toUpperCase().includes('OCIAN');
}

function BadgeStatus({ status }: { status: Partida['status'] }) {
  if (status === 'AO_VIVO') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.vermelho + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.vermelho }} />
        <Text style={{ fontFamily: 'Creato-Bold', color: colors.vermelho, fontSize: 10 }}>AO VIVO</Text>
      </View>
    );
  }
  if (status === 'FINALIZADA') {
    return (
      <View style={{ backgroundColor: '#2a2a2a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ fontFamily: 'Creato-Bold', color: colors.text_secondary, fontSize: 10 }}>ENCERRADO</Text>
      </View>
    );
  }
  return null;
}

export default function Jogos() {
  const router = useRouter();
  const isAdmin = true;

  const [mesAtivo, setMesAtivo] = useState(new Date().getMonth() + 1);
  const [catAtiva, setCatAtiva] = useState('Todas');
  const [modalMesVisible, setModalMesVisible] = useState(false);
  const [dias, setDias] = useState<DiaJogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarPartidas = useCallback(async () => {
    try {
      const params: any = { mes: mesAtivo };
      const partidas: Partida[] = await fetchPartidas(params);
      setDias(agruparPorDia(partidas));
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [mesAtivo]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarPartidas();
    }, [carregarPartidas])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarPartidas();
  };

  const partidasFiltradas = (partidas: Partida[]) => {
    if (catAtiva === 'Todas') return partidas;
    return partidas.filter(p =>
      p.categoria?.nome.replace('-', ' ').toUpperCase() === catAtiva.replace('-', ' ').toUpperCase()
    );
  };

 const placar = (p: Partida) => {
  if (p.status === 'AGENDADA') return '-';
  return `${p.gols_mandante}  ×  ${p.gols_visitante}`;
};

const [modalOrganizar, setModalOrganizar] = useState(false);

  return (
    <View style={styles.container}>
      <Header title="JOGOS" btnNotificacao="bell" showLogo={false} icon="soccer" showProfile={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.filtersContainer}>
          <View style={styles.filterHeader}>
            <TouchableOpacity activeOpacity={0.7} style={styles.monthSelectorBtn} onPress={() => setModalMesVisible(true)}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.monthSelectorText}>{FILTROS_MES[mesAtivo - 1]}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {FILTROS_CAT.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, catAtiva === cat && styles.pillActive]}
                onPress={() => setCatAtiva(cat)}
              >
                <Text style={[styles.pillText, catAtiva === cat && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : dias.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={48} color="#333" />
            <Text style={{ fontFamily: 'Creato-Bold', color: '#444', fontSize: 14, letterSpacing: 1 }}>
              NENHUM JOGO NESTE MÊS
            </Text>
          </View>
        ) : (
          dias.map((dia, index) => {
            const filtradas = partidasFiltradas(dia.partidas);
            if (filtradas.length === 0) return null;
            return (
              <View key={index} style={styles.daySection}>
                <View style={styles.dateHeader}>
                  <View style={styles.dateBar} />
                  <Text style={styles.dateText}>{dia.data}</Text>
                </View>

                {filtradas.map(partida => {
                  const ocianJoga = isOcian(partida.mandante) || isOcian(partida.visitante);
                  return (
                    <View key={partida.id} style={[styles.matchCard, ocianJoga && styles.matchCardOcian]}>

                      <View style={styles.cardTop}>
                        <View style={styles.cardTopLeft}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.text_secondary} />
                          <Text style={styles.timeText}>{partida.horario ?? '--:--'}</Text>
                          <View style={styles.separator} />
                          <Text style={styles.catText}>{partida.categoria?.nome ?? '—'}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <BadgeStatus status={partida.status} />
                          {ocianJoga && (
                            <View style={styles.badge}>
                              <MaterialCommunityIcons
                                name={partida.emCasa ? 'home-outline' : 'bus'}
                                size={14}
                                color={colors.text}
                              />
                              <Text style={styles.badgeText}>{partida.emCasa ? 'CASA' : 'FORA'}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.teamCol}>
                          {partida.mandante.escudo ? (
                            <Image source={{ uri: partida.mandante.escudo }} style={styles.teamLogo} />
                          ) : (
                            <View style={[styles.teamLogo, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a' }]}>
                              <MaterialCommunityIcons name="shield-outline" size={28} color="#444" />
                            </View>
                          )}
                          <Text style={styles.teamName} numberOfLines={2}>{partida.mandante.nome}</Text>
                        </View>

                        <View style={{ alignItems: 'center', gap: 4 }}>
                          <Text style={styles.versusText}>{placar(partida)}</Text>
                          {partida.status === 'AGENDADA' && (
                            <Text style={{ fontFamily: 'Creato-Regular', color: '#444', fontSize: 10, letterSpacing: 1 }}>VS</Text>
                          )}
                        </View>

                        <View style={styles.teamCol}>
                          {partida.visitante.escudo ? (
                            <Image source={{ uri: partida.visitante.escudo }} style={styles.teamLogo} />
                          ) : (
                            <View style={[styles.teamLogo, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a' }]}>
                              <MaterialCommunityIcons name="shield-outline" size={28} color="#444" />
                            </View>
                          )}
                          <Text style={styles.teamName} numberOfLines={2}>{partida.visitante.nome}</Text>
                        </View>
                      </View>

                      <View style={styles.cardFooter}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#AAAAAA" />
                        <Text style={styles.locationText}>{partida.local ?? 'Local não definido'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity activeOpacity={0.8} style={styles.fab} onPress={() => setModalOrganizar(true)}>
          <LinearGradient colors={['#0E78FF', '#2C88FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
            <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

       <Modal
        visible={modalOrganizar}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModalOrganizar(false)}
      >
        <OrganizarPartidas
        noModal={true}
        onFechar={() => {
        setModalOrganizar(false);
        carregarPartidas();
        }} />
      </Modal>

    </View>
  );
}