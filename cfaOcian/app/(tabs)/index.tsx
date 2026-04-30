import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { styles } from './indexStyles';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { useRef, useState, useEffect } from 'react';
import PagerView from 'react-native-pager-view';
import { HistoricoPartidas } from '@/src/components/HistoricoPartidas';
import { obterPerfisJogadores, calcularResumo, Jogador, ResumoCategoria } from '@/src/services/mlService';

const CATEGORIAS = [
  { id: '1', title: 'SUB 12', key: 'sub12' },
  { id: '2', title: 'SUB 18', key: 'sub18' },
  { id: '3', title: 'SUB 20', key: 'sub20' },
];

const LARGURA_ITEM_SELECTOR = 120;
const ITEM_INTERVAL = LARGURA_ITEM_SELECTOR + 10;

interface PageContentProps {
  resumo: ResumoCategoria;
  carregando: boolean;
}

const PageContent = ({ resumo, carregando }: PageContentProps) => (
  <View style={styles.pageContainer}>
    <FlatList
      data={[...Array(5)]}
      keyExtractor={(_, index) => String(index)}
      contentContainerStyle={styles.flatListContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={() => (
        <View style={styles.headerContainer}>

          <View style={styles.seasonCard}>
            <Text style={styles.seasonTitle}>PRÓXIMO JOGO</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.seasonStatus}>EM BREVE</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mainCard}>

            <View style={styles.containerIcon}>
              <View style={styles.topCard}>
                <Text style={styles.cardLabel}>Campeonato Regional</Text>
                <View>
                  <Text style={styles.teamName}>
                    Santos Futsal
                  </Text>
                </View>
              </View>
              <View>
                {/* OPCIONAL ICONE SE É JOGO EM CASA OU FORA */}
                <FontAwesome5 name="bus" size={22} color={colors.azulClaro} />
                {/* <MaterialCommunityIcons name="home-outline" size={26} color={colors.azulClaro} /> */}
              </View>
            </View>

            <View style={styles.hr}/>

            <View style={styles.rowSpaceBetween}>
              <View style={styles.cardHoraData}>

                <View style={styles.containerDataHora}>
                  <FontAwesome5 name="calendar" size={18} color={colors.text} />
                  <View style={styles.containerTextDataHora}>
                    <Text style={styles.titleDataHora}>Data</Text>
                    <Text style={styles.subTitleDataHora}>21 Mar</Text>
                  </View>
                </View>
                
                <View style={styles.containerDataHora}>
                  <FontAwesome5 name="clock" size={18} color={colors.text} />
                  <View style={styles.containerTextDataHora}>
                    <Text style={styles.titleDataHora}>Horário</Text>
                    <Text style={styles.subTitleDataHora}>19:30</Text>
                  </View>
                </View>

              </View>

              <View style={styles.containerLocalizacao}>
                <Octicons name="location" size={20} color={colors.azulClaro} />
                <Text style={styles.txtLocalizacao}>Ginásio Falcão, Praia Grande</Text>
              </View>

              <TouchableOpacity style={styles.btnDetalhes} activeOpacity={0.8}>
                <Text style={styles.txtDetalhes}>VER DETALHES DA PARTIDA</Text>
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.rowCards}>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>LÍDER</Text>
              <View style={styles.smallCardContent}>
                <Text style={styles.cardValue}>
                  {carregando ? '...' : (resumo.lider?.nome ?? '—')}
                </Text>
                <Text style={styles.cardLabel}>
                  {carregando ? '-' : `${resumo.lider?.pontos ?? 0} pontos`}
                </Text>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={24}
                  color={colors.azulClaro}
                  style={styles.iconRight}
                />
              </View>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>ASSISTÊNCIAS</Text>
              <View style={styles.smallCardContent}>
                <Text style={styles.cardValue}>
                  {carregando ? '...' : (resumo.assistente?.nome ?? '—')}
                </Text>
                <Text style={styles.cardLabel}>
                  {carregando ? '-' : `${resumo.assistente?.assistencias ?? 0} passes decisivos`}
                </Text>
                <View style={styles.rowDefault}>
                  <Text style={styles.txtColocacao}>
                    {carregando ? '-' : `#${String(resumo.assistente?.colocacao ?? 0).padStart(2, '0')}`}
                  </Text>
                  <FontAwesome5
                    name="handshake"
                    size={24}
                    color={colors.azulClaro}
                    style={styles.iconRight}
                  />
                </View>
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
      renderItem={() => <HistoricoPartidas />}
    />
  </View>
);

export default function Home() {
  const flatListSelectorRef = useRef<FlatList>(null);
  const pagerRef = useRef<PagerView>(null);

  const [activeIndex, setActiveIndex] = useState(1);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    obterPerfisJogadores()
      .then(setJogadores)
      .finally(() => setCarregando(false));
  }, []);

  const resumoPorCategoria = CATEGORIAS.map(() => calcularResumo(jogadores));

  const handleSelectFromTop = (index: number) => {
    flatListSelectorRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  };

  const handlePrevious = () => { if (activeIndex > 0) handleSelectFromTop(activeIndex - 1); };
  const handleNext = () => { if (activeIndex < CATEGORIAS.length - 1) handleSelectFromTop(activeIndex + 1); };

  const onPageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    if (index !== activeIndex) {
      flatListSelectorRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setActiveIndex(index);
    }
  };

  const renderCategorySelectorItem = ({ item, index }: { item: any; index: number }) => {
    const isActive = index === activeIndex;
    if (isActive) {
      return (
        <LinearGradient
          colors={['#006AFF', '#009FFF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.activeItemContainer}
        >
          <Text style={styles.activeItemText}>{item.title}</Text>
        </LinearGradient>
      );
    }
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.title}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="CFA OCIAN" iconName="bell" showLogo={true} />

      <View style={styles.carrosselWrapper}>
        <View style={styles.carrosselInternal}>
          <TouchableOpacity onPress={handlePrevious} style={styles.botaoSeta} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={30} color="#FFF" />
          </TouchableOpacity>

          <FlatList
            ref={flatListSelectorRef}
            data={CATEGORIAS}
            horizontal
            renderItem={renderCategorySelectorItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListSelectorContent}
            snapToAlignment="center"
            snapToInterval={ITEM_INTERVAL}
            decelerationRate="fast"
            initialScrollIndex={1}
            scrollEnabled={false}
            getItemLayout={(_, index) => ({
              length: ITEM_INTERVAL,
              offset: ITEM_INTERVAL * index,
              index,
            })}
          />

          <TouchableOpacity onPress={handleNext} style={styles.botaoSeta} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-right" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={1}
        onPageSelected={onPageSelected}
        scrollEnabled={false}
      >
        {CATEGORIAS.map((cat, i) => (
          <View key={cat.id}>
            <PageContent
              resumo={resumoPorCategoria[i]}
              carregando={carregando}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}