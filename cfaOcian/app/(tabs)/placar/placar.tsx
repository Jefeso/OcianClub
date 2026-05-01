import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';
import { styles } from './placarStyles';
import PagerView from 'react-native-pager-view';
import { CarrosselSubs, SUBS } from '@/src/components/CarrosselSubs';

interface TimeClassificacao {
  id: number;
  posicao: number;
  clube: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  saldo_gols: number;
  serie: 'ouro' | 'prata' | 'bronze' | 'rubi';
  isOcian: boolean;
}

export default function Placar() {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const [faseAtiva, setFaseAtiva] = useState('FASE DE GRUPOS');
  const [loading, setLoading] = useState(false);
  const [tabela, setTabela] = useState<TimeClassificacao[]>([]);

  const handleSelectCategory = (index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  };

  const onPageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    if (index !== activeIndex) setActiveIndex(index);
  };

  useEffect(() => {
    const buscarClassificacao = async () => {
      setLoading(true);
      try {
        setTimeout(() => {
          setTabela([
            { id: 1, posicao: 1,  clube: 'OCIAN PRAIA CLUBE', pontos: 12, jogos: 4, vitorias: 4, empates: 0, derrotas: 0, saldo_gols: 18,  serie: 'ouro',   isOcian: true  },
            { id: 2, posicao: 2,  clube: 'Santos FC',          pontos: 10, jogos: 4, vitorias: 3, empates: 1, derrotas: 0, saldo_gols: 12,  serie: 'ouro',   isOcian: false },
            { id: 3, posicao: 9,  clube: 'Portuguesa',         pontos: 6,  jogos: 4, vitorias: 2, empates: 0, derrotas: 2, saldo_gols: 2,   serie: 'prata',  isOcian: false },
            { id: 4, posicao: 17, clube: 'São Caetano',        pontos: 4,  jogos: 4, vitorias: 1, empates: 1, derrotas: 2, saldo_gols: -4,  serie: 'bronze', isOcian: false },
            { id: 5, posicao: 25, clube: 'Jabaquara AC',       pontos: 0,  jogos: 4, vitorias: 0, empates: 0, derrotas: 4, saldo_gols: -14, serie: 'rubi',   isOcian: false },
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        setLoading(false);
      }
    };

    buscarClassificacao();
  }, [activeIndex, faseAtiva]);

  const getSerieColor = (serie: string) => {
    switch (serie) {
      case 'ouro':   return colors.amarelo;
      case 'prata':  return colors.cinza_claro;
      case 'bronze': return '#CD7F32';
      case 'rubi':   return colors.vermelho;
      default:       return 'transparent';
    }
  };

  return (
    <View style={styles.container}>
      <Header title="PLACAR" icon="trophy-outline" showLogo={false} showProfile={true} iconName='bell'/>

      <CarrosselSubs
        indexAtual={activeIndex}
        onChange={handleSelectCategory}
      />

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, faseAtiva === 'FASE DE GRUPOS' && styles.toggleBtnActive]}
          onPress={() => setFaseAtiva('FASE DE GRUPOS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, faseAtiva === 'FASE DE GRUPOS' && styles.toggleTextActive]}>
            FASE DE GRUPOS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, faseAtiva === 'GERAL' && styles.toggleBtnActive]}
          onPress={() => setFaseAtiva('GERAL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, faseAtiva === 'GERAL' && styles.toggleTextActive]}>
            GERAL
          </Text>
        </TouchableOpacity>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={1}
        onPageSelected={onPageSelected}
      >
        {SUBS.map((sub) => (
          <View key={sub.id}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, styles.colPos]}>POS</Text>
                  <Text style={[styles.thText, styles.colClube]}>CLUBE</Text>
                  <Text style={[styles.thText, styles.colStat]}>P</Text>
                  <Text style={[styles.thText, styles.colStat]}>J</Text>
                  <Text style={[styles.thText, styles.colStat]}>V</Text>
                  <Text style={[styles.thText, styles.colStat]}>E</Text>
                  <Text style={[styles.thText, styles.colStat]}>D</Text>
                  <Text style={[styles.thText, styles.colStat]}>SG</Text>
                </View>

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
                ) : (
                  tabela.map((time, index) => (
                    <View
                      key={time.id}
                      style={[
                        styles.tableRow,
                        index !== tabela.length - 1 && styles.rowBorder,
                        time.isOcian && styles.tableRowOcian,
                      ]}
                    >
                      <View style={[styles.serieBar, { backgroundColor: getSerieColor(time.serie) }]} />

                      <Text style={[styles.colPosText, styles.colPos]}>{time.posicao}</Text>

                      <View style={styles.clubeContainer}>
                        <View style={styles.clubeIcone}>
                          <Text style={styles.clubeIniciais}>
                            {time.clube.split(' ').map(p => p[0]).join('').slice(0, 3)}
                          </Text>
                        </View>
                        <Text
                          style={[styles.tdText, styles.clubeText, time.isOcian && styles.ocianTextBold]}
                          numberOfLines={1}
                        >
                          {time.clube}
                        </Text>
                      </View>

                      <Text style={[styles.tdText, styles.colStat, styles.colStatDestaque, time.isOcian && styles.ocianHighlightColor]}>
                        {time.pontos}
                      </Text>
                      <Text style={[styles.tdText, styles.colStat]}>{time.jogos}</Text>
                      <Text style={[styles.tdText, styles.colStat]}>{time.vitorias}</Text>
                      <Text style={[styles.tdText, styles.colStat]}>{time.empates}</Text>
                      <Text style={[styles.tdText, styles.colStat]}>{time.derrotas}</Text>
                      <Text style={[styles.tdText, styles.colStat, styles.colStatDestaque, time.isOcian && styles.ocianHighlightColor]}>
                        {time.saldo_gols > 0 ? `+${time.saldo_gols}` : time.saldo_gols}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Legenda</Text>
                <View style={styles.legendGrid}>
                  {[
                    { cor: colors.amarelo,     label: 'SÉRIE OURO'   },
                    { cor: colors.cinza_claro, label: 'SÉRIE PRATA'  },
                    { cor: '#CD7F32',          label: 'SÉRIE BRONZE' },
                    { cor: colors.vermelho,    label: 'SÉRIE RUBI'   },
                  ].map(({ cor, label }) => (
                    <View key={label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: cor }]} />
                      <Text style={styles.legendText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        ))}
      </PagerView>
    </View>
  );
}