import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './indexStyles';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { useRef, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { HistoricoPartidas } from '@/src/components/HistoricoPartidas';
import { fetchPartidas } from '@/src/services/api';
import { CarrosselSubs, SUBS_INICIACAO, SUBS_BASE } from '@/src/components/CarrosselSubs';

const NOME_CLUBE = 'OCIAN';
const isOcian = (nome: string) => nome.toUpperCase().includes(NOME_CLUBE);

// ── INTERFACES ──
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
  competicao?: { id: number; nome: string; ano: number } | null;
}

interface Estatisticas {
  pontos: number;
  vitorias: number;
}

interface PageContentProps {
  carregando: boolean;
  proximoJogo: Partida | null;
  estatisticas: Estatisticas;
  historico: Partida[]; // <-- NOVA PROP PARA O HISTÓRICO
}

// ── FORMATADOR DE DATA ──
const formatarDataCard = (dataStr: string) => {
  const [ano, mes, dia] = dataStr.split('T')[0].split('-');
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

// ── COMPONENTE DA PÁGINA (CONTEÚDO DO SUB) ──
const PageContent = ({ carregando, proximoJogo, estatisticas, historico }: PageContentProps) => {
  const adversario = proximoJogo 
    ? (isOcian(proximoJogo.mandante.nome) ? proximoJogo.visitante.nome : proximoJogo.mandante.nome) 
    : '—';

  return (
    <View style={styles.pageContainer}>
      <FlatList
        data={historico} // <-- PASSANDO OS DADOS REAIS
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          !carregando ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontFamily: 'Creato-Medium', color: '#666' }}>Nenhuma partida finalizada neste Sub.</Text>
            </View>
          ) : null
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>

            {/* ── CARD: PRÓXIMO JOGO ── */}
            <View style={styles.seasonCard}>
              <Text style={styles.seasonTitle}>PRÓXIMO JOGO</Text>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.seasonStatus}>{proximoJogo ? 'EM BREVE' : 'SEM JOGOS'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainCard}>
              {carregando ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
              ) : !proximoJogo ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
                  <MaterialCommunityIcons name="calendar-remove-outline" size={40} color="#444" />
                  <Text style={{ fontFamily: 'Creato-Bold', color: '#666' }}>Nenhuma partida agendada</Text>
                </View>
              ) : (
                <>
                  <View style={styles.containerIcon}>
                    <View style={styles.topCard}>
                      <Text style={styles.cardLabel} numberOfLines={1}>
                        {proximoJogo.competicao?.nome || 'Amistoso / Campeonato Regional'}
                      </Text>
                      <View>
                        <Text style={styles.teamName} numberOfLines={1}>{adversario}</Text>
                      </View>
                    </View>
                    <View>
                      <FontAwesome5 name={proximoJogo.emCasa ? 'home' : 'bus'} size={22} color={colors.azulClaro} />
                    </View>
                  </View>

                  <View style={styles.hr} />

                  <View style={styles.rowSpaceBetween}>
                    <View style={styles.cardHoraData}>
                      <View style={styles.containerDataHora}>
                        <FontAwesome5 name="calendar" size={18} color={colors.text} />
                        <View style={styles.containerTextDataHora}>
                          <Text style={styles.titleDataHora}>Data</Text>
                          <Text style={styles.subTitleDataHora}>{formatarDataCard(proximoJogo.data)}</Text>
                        </View>
                      </View>

                      <View style={styles.containerDataHora}>
                        <FontAwesome5 name="clock" size={18} color={colors.text} />
                        <View style={styles.containerTextDataHora}>
                          <Text style={styles.titleDataHora}>Horário</Text>
                          <Text style={styles.subTitleDataHora}>{proximoJogo.horario || '--:--'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.containerLocalizacao}>
                      <Octicons name="location" size={20} color={colors.azulClaro} />
                      <Text style={styles.txtLocalizacao} numberOfLines={2}>
                        {proximoJogo.local || 'Local não definido'}
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.btnDetalhes} activeOpacity={0.8}>
                      <Text style={styles.txtDetalhes}>VER DETALHES DA PARTIDA</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* ── CARDS DE ESTATÍSTICAS DO PLACAR ── */}
            <View style={styles.rowCards}>
              <View style={styles.smallCard}>
                <Text style={styles.cardLabel}>PONTUAÇÃO</Text>
                <View style={styles.smallCardContent}>
                  <Text style={styles.cardValue}>
                    {carregando ? '...' : `${estatisticas.pontos}`}
                  </Text>
                  <Text style={styles.cardLabel}>Pontos ganhos</Text>
                  <MaterialCommunityIcons name="trophy-outline" size={28} color={colors.amarelo} style={styles.iconRight} />
                </View>
              </View>

              <View style={styles.smallCard}>
                <Text style={styles.cardLabel}>VITÓRIAS</Text>
                <View style={styles.smallCardContent}>
                  <Text style={styles.cardValue}>
                    {carregando ? '...' : `${estatisticas.vitorias}`}
                  </Text>
                  <Text style={styles.cardLabel}>Na temporada</Text>
                  <MaterialCommunityIcons name="medal-outline" size={28} color={colors.azulClaro} style={styles.iconRight} />
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimas partidas</Text>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.seeAllButton}>VER TUDO</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
        renderItem={({ item }) => <HistoricoPartidas partida={item} />} // <-- PASSANDO O ITEM REAL
      />
    </View>
  );
};

export default function Home() {
  const pagerRef = useRef<PagerView>(null);

  // ── ESTADOS ──
  const [faseAtiva, setFaseAtiva] = useState<'INICIACAO' | 'BASE'>('INICIACAO');
  const [subIndex, setSubIndex] = useState(0);
  
  const [partidasGlobais, setPartidasGlobais] = useState<Partida[]>([]);
  const [carregando, setCarregando] = useState(true);

  const subsAtuais = faseAtiva === 'INICIACAO' ? SUBS_INICIACAO : SUBS_BASE;

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      fetchPartidas({})
        .then(setPartidasGlobais)
        .catch(console.error)
        .finally(() => setCarregando(false));
    }, [])
  );

  const handleTrocarFase = (novaFase: 'INICIACAO' | 'BASE') => {
    setFaseAtiva(novaFase);
    handleSubChange(0); 
  };

  const handleSubChange = (index: number) => {
    setSubIndex(index);
    pagerRef.current?.setPage(index);
  };

  const onPageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    if (index !== subIndex) setSubIndex(index);
  };

  return (
    <View style={styles.container}>
      <Header title="CFA OCIAN" btnNotificacao="bell" showLogo={true} showProfile={true} />

      <CarrosselSubs 
        tipoFiltro={faseAtiva}
        onTrocarTipo={handleTrocarFase}
        indexAtual={subIndex} 
        onChangeIndex={handleSubChange} 
      />

      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={onPageSelected}
        scrollEnabled={true}
      >
        {subsAtuais.map((sub) => {
          // 1. Filtra as partidas desse Sub que o Ocian joga
          const partidasDoSub = partidasGlobais.filter(p => 
            p.categoria?.nome.replace(' ', '-').toUpperCase() === sub.title &&
            (isOcian(p.mandante.nome) || isOcian(p.visitante.nome))
          );

          // 2. Próximo Jogo (AGENDADA)
          const agendadas = partidasDoSub
            .filter(p => p.status === 'AGENDADA')
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
          const proximoJogo = agendadas.length > 0 ? agendadas[0] : null;

          // 3. Histórico (FINALIZADA) ordenadas da mais recente para a mais antiga (Limitamos às últimas 5)
          const finalizadas = partidasDoSub
            .filter(p => p.status === 'FINALIZADA')
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          
          const historicoRecente = finalizadas.slice(0, 5); // Pega só as 5 últimas pra não travar a home

          // 4. Estatísticas
          let pontos = 0;
          let vitorias = 0;
          finalizadas.forEach(p => {
            const ocianEhMandante = isOcian(p.mandante.nome);
            const golsOcian = ocianEhMandante ? p.gols_mandante : p.gols_visitante;
            const golsAdv = ocianEhMandante ? p.gols_visitante : p.gols_mandante;

            if (golsOcian > golsAdv) {
              pontos += 3;
              vitorias += 1;
            } else if (golsOcian === golsAdv) {
              pontos += 1;
            }
          });

          return (
            <View key={`${faseAtiva}-${sub.id}`}>
              <PageContent
                carregando={carregando}
                proximoJogo={proximoJogo}
                estatisticas={{ pontos, vitorias }}
                historico={historicoRecente}
              />
            </View>
          );
        })}
      </PagerView>
    </View>
  );
}