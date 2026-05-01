import { useRef, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme/colors';

const { width: windowWidth } = Dimensions.get('window');
const MARGEM_CONTEUDO = 20;
const LARGURA_DISPONIVEL = windowWidth - MARGEM_CONTEUDO * 2;
const LARGURA_ITEM = 120;
const ITEM_INTERVAL = LARGURA_ITEM + 10;

export const SUBS = [
  { id: '1', title: 'SUB 12' },
  { id: '2', title: 'SUB 14' },
  { id: '3', title: 'SUB 16' },
  { id: '4', title: 'SUB 18' },
];

interface CarrosselSubsProps {
  indexAtual: number;
  onChange: (index: number) => void;
}

export function CarrosselSubs({ indexAtual, onChange }: CarrosselSubsProps) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: indexAtual, animated: true, viewPosition: 0.5 });
  }, [indexAtual]);

  const irParaAnterior = () => {
    if (indexAtual > 0) onChange(indexAtual - 1);
  };

  const irParaProximo = () => {
    if (indexAtual < SUBS.length - 1) onChange(indexAtual + 1);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.internal}>
        <TouchableOpacity onPress={irParaAnterior} style={styles.botao} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#FFF" />
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={SUBS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          getItemLayout={(_, index) => ({
            length: ITEM_INTERVAL,
            offset: ITEM_INTERVAL * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const isActive = index === indexAtual;
            if (isActive) {
              return (
                <LinearGradient
                  colors={['#006AFF', '#009FFF']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.itemAtivo}
                >
                  <Text style={styles.textoAtivo}>{item.title}</Text>
                </LinearGradient>
              );
            }
            return (
              <View style={styles.item}>
                <Text style={styles.texto}>{item.title}</Text>
              </View>
            );
          }}
        />

        <TouchableOpacity onPress={irParaProximo} style={styles.botao} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: MARGEM_CONTEUDO,
    marginTop: 10,
    paddingBottom: 10,
  },
  internal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  botao: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    alignItems: 'center',
    paddingHorizontal: (LARGURA_DISPONIVEL - 40 * 2 - 10 * 2 - LARGURA_ITEM) / 2,
  },
  item: {
    width: LARGURA_ITEM,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  itemAtivo: {
    width: LARGURA_ITEM,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 5,
  },
  texto: {
    fontFamily: 'Creato-Bold',
    color: '#666',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  textoAtivo: {
    fontFamily: 'Creato-Bold',
    color: '#FFF',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});