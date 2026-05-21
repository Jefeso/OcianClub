// cfaOcian/src/components/OrganizarPartidaCampeonato.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Modal, Pressable, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchTimes, fetchCategorias, criarPartida, atualizarPartida } from '@/src/services/api';
import { styles } from '@/src/styles/organizarPartidasStyles';

interface Categoria { id: number; nome: string; tipo: 'INICIACAO' | 'BASE'; }
interface Time { id: number; nome: string; escudo: string | null; categoria_id: number; }
interface Competicao { id: number; nome: string; ano: number; tipo: 'INICIACAO' | 'BASE'; }

interface PartidaExistente {
  id: number;
  rodada: number | null;
  grupo: string | null;
  data: string;
  horario: string | null;
  local: string | null;
  emCasa: boolean;
  mandante: Time;
  visitante: Time;
  categoria: { id: number; nome: string };
}

interface Props {
  competicao: Competicao;
  partida?: PartidaExistente;
  onFechar: () => void;
  onSalvo: () => void;
}

const ORDEM_SUBS: Record<string, number> = {
  'SUB 7': 1, 'SUB-7': 1, 'SUB 8': 2, 'SUB-8': 2, 'SUB 9': 3, 'SUB-9': 3,
  'SUB 10': 4, 'SUB-10': 4, 'SUB 12': 5, 'SUB-12': 5, 'SUB 14': 6, 'SUB-14': 6,
  'SUB 16': 7, 'SUB-16': 7, 'SUB 18': 8, 'SUB-18': 8,
};

const GRUPOS = ['A', 'B', 'C', 'D'];

function EscudoTime({ escudo, nome, size = 40 }: { escudo: string | null; nome: string; size?: number }) {
  if (escudo) return <Image source={{ uri: escudo }} style={{ width: size, height: size, resizeMode: 'contain' }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text_secondary, fontSize: size * 0.25 }}>
        {nome.split(' ').map(p => p[0]).join('').slice(0, 3)}
      </Text>
    </View>
  );
}

function dataParaInput(dataStr: string): string {
  const [, mes, dia] = dataStr.split('T')[0].split('-');
  return `${dia}/${mes}`;
}

export default function OrganizarPartidaCampeonato({ competicao, partida, onFechar, onSalvo }: Props) {
  const modoEdicao = !!partida;

  const [times, setTimes] = useState<Time[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [categoriaId, setCategoriaId] = useState<number | null>(partida?.categoria.id ?? null);
  const [mandante, setMandante] = useState<Time | null>(partida?.mandante ?? null);
  const [visitante, setVisitante] = useState<Time | null>(partida?.visitante ?? null);
  const [modalTime, setModalTime] = useState<'mandante' | 'visitante' | null>(null);
  const [buscaTime, setBuscaTime] = useState('');

  const [rodada, setRodada] = useState(partida?.rodada ? String(partida.rodada) : '');
  const [grupo, setGrupo] = useState<string | null>(partida?.grupo ?? null);
  const [data, setData] = useState(partida?.data ? dataParaInput(partida.data) : '');
  const [horario, setHorario] = useState(partida?.horario ?? '');
  const [local, setLocal] = useState(partida?.local ?? '');
  const [emCasa, setEmCasa] = useState(partida?.emCasa ?? true);
  const [salvando, setSalvando] = useState(false);

  const ehBase = competicao.tipo === 'BASE';

  useEffect(() => {
    Promise.all([fetchTimes(), fetchCategorias()])
      .then(([timesData, catData]) => {
        setTimes(timesData);
        const catFiltradas: Categoria[] = catData
          .filter((c: Categoria) => c.tipo === competicao.tipo)
          .sort((a: Categoria, b: Categoria) =>
            (ORDEM_SUBS[a.nome.toUpperCase()] ?? 99) - (ORDEM_SUBS[b.nome.toUpperCase()] ?? 99)
          );
        setCategorias(catFiltradas);
        if (!partida && catFiltradas.length > 0) setCategoriaId(catFiltradas[0].id);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  const timesFiltrados = times.filter(t =>
    t.categoria_id === categoriaId &&
    t.nome.toLowerCase().includes(buscaTime.toLowerCase())
  );

  const selecionarTime = (time: Time) => {
    if (modalTime === 'mandante') setMandante(time);
    else setVisitante(time);
    setModalTime(null);
    setBuscaTime('');
  };

  const handleDataChange = (text: string) => {
    const n = text.replace(/\D/g, '');
    setData(n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2, 4)}` : n);
  };

  const handleHorarioChange = (text: string) => {
    const n = text.replace(/\D/g, '');
    setHorario(n.length > 2 ? `${n.slice(0, 2)}:${n.slice(2, 4)}` : n);
  };

  const salvar = async () => {
    if (!mandante || !visitante || !categoriaId || !rodada) return;
    if (data.length < 5 || horario.length < 5) return;
    if (ehBase && !grupo) return Alert.alert('Atenção', 'Selecione o grupo da partida.');

    setSalvando(true);
    try {
      const [dia, mes] = data.split('/');
      const ano = new Date().getFullYear();
      const dataISO = `${ano}-${mes}-${dia}`;

      if (modoEdicao && partida) {
        await atualizarPartida(partida.id, {
          mandante_id: mandante.id,
          visitante_id: visitante.id,
          data: dataISO,
          horario,
          local,
          emCasa,
          categoria_id: categoriaId,
          rodada: Number(rodada),
          grupo: grupo ?? undefined,
        });
      } else {
        await criarPartida({
          mandante_id: mandante.id,
          visitante_id: visitante.id,
          data: dataISO,
          horario,
          local,
          emCasa,
          categoria_id: categoriaId,
          competicao_id: competicao.id,
          rodada: Number(rodada),
          grupo: grupo ?? undefined,
        });
      }

      onSalvo();
      onFechar();
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível salvar a partida.');
    } finally {
      setSalvando(false);
    }
  };

  const isValido = mandante && visitante && categoriaId && rodada &&
    data.length === 5 && horario.length === 5 &&
    (!ehBase || grupo !== null);

  return (
    <View style={styles.container}>
      <Header
        title={modoEdicao ? 'Editar Partida' : competicao.nome}
        showLogo={false} showProfile={false}
        btnVoltar="arrow-left" onBtnVoltar={onFechar} semSafeArea
      />

      {carregando ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          <Text style={styles.sectionLabel}>CATEGORIA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {categorias.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, categoriaId === cat.id && styles.pillActive, modoEdicao && { opacity: 0.5 }]}
                onPress={() => { if (!modoEdicao) { setCategoriaId(cat.id); setMandante(null); setVisitante(null); } }}
                disabled={modoEdicao}
              >
                <Text style={[styles.pillText, categoriaId === cat.id && styles.pillTextActive]}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.rowDuplo}>
            <View style={styles.halfBlock}>
              <Text style={styles.sectionLabel}>RODADA</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="numeric" size={18} color={colors.text_secondary} />
                <TextInput style={styles.inputText} placeholder="Ex: 1" placeholderTextColor={colors.text_secondary} value={rodada} onChangeText={t => setRodada(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={3} />
              </View>
            </View>
            {ehBase && (
              <View style={styles.halfBlock}>
                <Text style={styles.sectionLabel}>GRUPO</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {GRUPOS.map(g => (
                    <TouchableOpacity key={g} style={[styles.pill, grupo === g && styles.pillActive, { flex: 1, justifyContent: 'center' }]} onPress={() => setGrupo(g)}>
                      <Text style={[styles.pillText, grupo === g && styles.pillTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>CONFRONTO</Text>
          <View style={styles.confrontoContainer}>
            {(['mandante', 'visitante'] as const).map((tipo, index) => {
              const time = tipo === 'mandante' ? mandante : visitante;
              return (
                <React.Fragment key={tipo}>
                  <TouchableOpacity style={[styles.timeCard, time !== null && styles.timeCardSelecionado]} onPress={() => setModalTime(tipo)}>
                    {time ? (
                      <>
                        <EscudoTime escudo={time.escudo} nome={time.nome} size={44} />
                        <Text style={styles.timeCardLabel}>{tipo === 'mandante' ? 'MANDANTE' : 'VISITANTE'}</Text>
                        <Text style={styles.timeCardNome} numberOfLines={2}>{time.nome}</Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.addIconCircle}><MaterialCommunityIcons name="plus" size={28} color={colors.text_secondary} /></View>
                        <Text style={styles.timeCardLabel}>{tipo === 'mandante' ? 'MANDANTE' : 'VISITANTE'}</Text>
                        <Text style={styles.timeCardSub}>Selecione o time</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {index === 0 && (
                    <LinearGradient colors={['#006AFF', '#009FFF']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.vsBadge}>
                      <Text style={styles.vsText}>VS</Text>
                    </LinearGradient>
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>MANDO DE CAMPO</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[{ label: 'CASA', icon: 'home-outline', value: true }, { label: 'FORA', icon: 'bus', value: false }].map(opt => (
              <TouchableOpacity key={opt.label} style={[styles.pill, { flexDirection: 'row', gap: 6, alignItems: 'center' }, emCasa === opt.value && styles.pillActive]} onPress={() => setEmCasa(opt.value)}>
                <MaterialCommunityIcons name={opt.icon as any} size={14} color={emCasa === opt.value ? colors.text : colors.text_secondary} />
                <Text style={[styles.pillText, emCasa === opt.value && styles.pillTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowDuplo}>
            <View style={styles.halfBlock}>
              <Text style={styles.sectionLabel}>DATA</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.text_secondary} />
                <TextInput style={styles.inputText} placeholder="DD/MM" placeholderTextColor={colors.text_secondary} value={data} onChangeText={handleDataChange} keyboardType="numeric" maxLength={5} />
              </View>
            </View>
            <View style={styles.halfBlock}>
              <Text style={styles.sectionLabel}>HORÁRIO</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.text_secondary} />
                <TextInput style={styles.inputText} placeholder="00:00" placeholderTextColor={colors.text_secondary} value={horario} onChangeText={handleHorarioChange} keyboardType="numeric" maxLength={5} />
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>LOCAL DA PARTIDA</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.text_secondary} />
            <TextInput style={[styles.inputText, { flex: 1 }]} placeholder="Ginásio, quadra ou campo..." placeholderTextColor={colors.text_secondary} value={local} onChangeText={setLocal} />
          </View>

          <TouchableOpacity style={[styles.salvarBtn, !isValido && { opacity: 0.5 }]} onPress={salvar} disabled={!isValido || salvando} activeOpacity={0.85}>
            <LinearGradient colors={['#006AFF', '#009FFF']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.salvarGradient}>
              {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.salvarText}>{modoEdicao ? 'SALVAR ALTERAÇÕES' : 'SALVAR PARTIDA'}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <Modal visible={modalTime !== null} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => { setModalTime(null); setBuscaTime(''); }}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTime === 'mandante' ? 'Selecionar Mandante' : 'Selecionar Visitante'}</Text>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} onPress={() => { setModalTime(null); setBuscaTime(''); }} />
            </View>
            <View style={[styles.inputRow, { marginBottom: 12 }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.text_secondary} />
              <TextInput style={[styles.inputText, { flex: 1 }]} placeholder="Buscar time..." placeholderTextColor={colors.text_secondary} value={buscaTime} onChangeText={setBuscaTime} autoFocus />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {timesFiltrados.length === 0 ? (
                <Text style={{ color: colors.text_secondary, textAlign: 'center', paddingVertical: 20 }}>Nenhum time encontrado.</Text>
              ) : (
                timesFiltrados.map(time => {
                  const selecionado = modalTime === 'mandante' ? mandante?.id === time.id : visitante?.id === time.id;
                  return (
                    <TouchableOpacity key={time.id} style={[styles.modalItem, selecionado && styles.modalItemActive]} onPress={() => selecionarTime(time)}>
                      <EscudoTime escudo={time.escudo} nome={time.nome} size={32} />
                      <Text style={[styles.modalItemText, selecionado && styles.modalItemTextActive]}>{time.nome}</Text>
                      {selecionado && <MaterialCommunityIcons name="check" size={18} color={colors.azulClaro} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}