import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import { styles } from './organizarPartidasStyles';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { fetchTimes, fetchCompeticoes, criarPartida } from '@/src/services/api';

const CATEGORIAS = [
  { id: 1, nome: 'SUB 12' },
  { id: 2, nome: 'SUB 14' },
  { id: 3, nome: 'SUB 16' },
  { id: 4, nome: 'SUB 18' },
];

interface OrganizarPartidasProps {
  onFechar: () => void;
  noModal?: boolean; 
}

interface Time { id: number; nome: string; escudo: string | null; }
interface Competicao { id: number; nome: string; ano: number; }

function EscudoTime({ escudo, nome, size = 40 }: { escudo: string | null; nome: string; size?: number }) {
  if (escudo) {
    return <Image source={{ uri: escudo }} style={{ width: size, height: size, resizeMode: 'contain' }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Creato-Bold', color: colors.text_secondary, fontSize: size * 0.25 }}>
        {nome.split(' ').map(p => p[0]).join('').slice(0, 3)}
      </Text>
    </View>
  );
}

export default function OrganizarPartidas({ onFechar, noModal  }: OrganizarPartidasProps) {
  const router = useRouter();

  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [competicaoSelecionada, setCompeticaoSelecionada] = useState<Competicao | null>(null);
  const [modalCompeticao, setModalCompeticao] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [categoriaId, setCategoriaId] = useState(CATEGORIAS[0].id);
  const [mandante, setMandante] = useState<Time | null>(null);
  const [visitante, setVisitante] = useState<Time | null>(null);
  const [modalTime, setModalTime] = useState<'mandante' | 'visitante' | null>(null);
  const [times, setTimes] = useState<Time[]>([]);
  const [buscaTime, setBuscaTime] = useState('');
  
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [local, setLocal] = useState('');
  const [emCasa, setEmCasa] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    // Carrega times e competições simultaneamente
    Promise.all([fetchTimes(), fetchCompeticoes()])
      .then(([timesData, competicoesData]) => {
        setTimes(timesData);
        setCompeticoes(competicoesData);
        if (competicoesData.length > 0) {
          setCompeticaoSelecionada(competicoesData[0]);
        }
      })
      .catch(console.error)
      .finally(() => setCarregandoDados(false));
  }, []);

  const timesFiltrados = times.filter(t =>
    t.nome.toLowerCase().includes(buscaTime.toLowerCase())
  );

  const selecionarTime = (time: Time) => {
    if (modalTime === 'mandante') {
      setMandante(mandante?.id === time.id ? null : time);
    } else {
      setVisitante(visitante?.id === time.id ? null : time);
    }
    setModalTime(null);
    setBuscaTime('');
  };

  const handleDataChange = (text: string) => {
    const numeros = text.replace(/\D/g, ''); 
    let formatado = numeros;
    if (numeros.length > 2) {
      formatado = `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}`;
    }
    setData(formatado);
  };

  const handleHorarioChange = (text: string) => {
    const numeros = text.replace(/\D/g, ''); 
    let formatado = numeros;
    if (numeros.length > 2) {
      formatado = `${numeros.slice(0, 2)}:${numeros.slice(2, 4)}`;
    }
    setHorario(formatado);
  };

  const salvar = async () => {
    if (!mandante || !visitante || data.length < 5 || horario.length < 5) return;
    setSalvando(true);
    try {
      const [dia, mes] = data.split('/');
      const ano = new Date().getFullYear(); 
      
      await criarPartida({
        mandante_id: mandante.id,
        visitante_id: visitante.id,
        data: `${ano}-${mes}-${dia}`,
        horario,
        local,
        emCasa,
        categoria_id: categoriaId,
        competicao_id: competicaoSelecionada?.id, // Envia o ID da competição
      });
      onFechar()
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  const isFormValido = mandante && visitante && data.length === 5 && horario.length === 5;

  return (
    <View style={styles.container}>
      <Header title="ORGANIZAR PARTIDA" showLogo={false} showProfile={false} btnVoltar="arrow-left" onBtnVoltar={onFechar} semSafeArea={noModal} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── COMPETIÇÃO ── */}
        <Text style={styles.sectionLabel}>COMPETIÇÃO</Text>
        <TouchableOpacity 
          style={[styles.dropdownBtn, competicoes.length === 0 && { opacity: 0.5 }]} 
          activeOpacity={0.8} 
          onPress={() => competicoes.length > 0 && setModalCompeticao(true)}
        >
          <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.azulClaro} />
          {carregandoDados ? (
             <Text style={styles.dropdownText}>Carregando...</Text>
          ) : (
            <Text style={styles.dropdownText}>
              {competicaoSelecionada ? competicaoSelecionada.nome : 'Nenhuma competição cadastrada'}
            </Text>
          )}
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text_secondary} />
        </TouchableOpacity>

        {/* ── CATEGORIA ── */}
        <Text style={styles.sectionLabel}>CATEGORIA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, categoriaId === cat.id && styles.pillActive]}
              onPress={() => setCategoriaId(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, categoriaId === cat.id && styles.pillTextActive]}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── CONFRONTO ── */}
        <Text style={styles.sectionLabel}>CONFRONTO</Text>
        <View style={styles.confrontoContainer}>
          {(['mandante', 'visitante'] as const).map((tipo, index) => {
            const time = tipo === 'mandante' ? mandante : visitante;
            return (
              <React.Fragment key={tipo}>
                <TouchableOpacity
                  style={[styles.timeCard, time !== null && styles.timeCardSelecionado]}
                  activeOpacity={0.8}
                  onPress={() => setModalTime(tipo)}
                >
                  {time === null ? (
                    <>
                      <View style={styles.addIconCircle}>
                        <MaterialCommunityIcons name="plus" size={28} color={colors.text_secondary} />
                      </View>
                      <Text style={styles.timeCardLabel}>{tipo === 'mandante' ? 'MANDANTE' : 'VISITANTE'}</Text>
                      <Text style={styles.timeCardSub}>Selecione o time</Text>
                    </>
                  ) : (
                    <>
                      <EscudoTime escudo={time.escudo} nome={time.nome} size={44} />
                      <Text style={styles.timeCardLabel}>{tipo === 'mandante' ? 'MANDANTE' : 'VISITANTE'}</Text>
                      <Text style={styles.timeCardNome} numberOfLines={2}>{time.nome}</Text>
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

        {/* ── MANDO DE CAMPO ── */}
        <Text style={styles.sectionLabel}>MANDO DE CAMPO</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[{ label: 'CASA', icon: 'home-outline', value: true }, { label: 'FORA', icon: 'bus', value: false }].map(opt => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.pill, { flexDirection: 'row', gap: 6, alignItems: 'center' }, emCasa === opt.value && styles.pillActive]}
              onPress={() => setEmCasa(opt.value)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={opt.icon as any} size={14} color={emCasa === opt.value ? colors.text : colors.text_secondary} />
              <Text style={[styles.pillText, emCasa === opt.value && styles.pillTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── DATA E HORÁRIO ── */}
        <View style={styles.rowDuplo}>
          <View style={styles.halfBlock}>
            <Text style={styles.sectionLabel}>DATA</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.text_secondary} />
              <TextInput 
                style={styles.inputText} 
                placeholder="DD/MM" 
                placeholderTextColor={colors.text_secondary} 
                value={data} 
                onChangeText={handleDataChange} 
                keyboardType="numeric"
                maxLength={5} 
              />
            </View>
          </View>
          <View style={styles.halfBlock}>
            <Text style={styles.sectionLabel}>HORÁRIO</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.text_secondary} />
              <TextInput 
                style={styles.inputText} 
                placeholder="00:00" 
                placeholderTextColor={colors.text_secondary} 
                value={horario} 
                onChangeText={handleHorarioChange} 
                keyboardType="numeric"
                maxLength={5} 
              />
            </View>
          </View>
        </View>

        {/* ── LOCAL ── */}
        <Text style={styles.sectionLabel}>LOCAL DA PARTIDA</Text>
        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.text_secondary} />
          <TextInput style={[styles.inputText, { flex: 1 }]} placeholder="Ginásio, quadra ou campo..." placeholderTextColor={colors.text_secondary} value={local} onChangeText={setLocal} />
          <TouchableOpacity><Text style={styles.explorarText}>EXPLORAR</Text></TouchableOpacity>
        </View>

        {/* ── SALVAR ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={salvar}
          style={[styles.salvarBtn, !isFormValido && { opacity: 0.5 }]}
          disabled={!isFormValido || salvando}
        >
          <LinearGradient colors={['#006AFF', '#009FFF']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.salvarGradient}>
            {salvando
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.salvarText}>SALVAR PARTIDA</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── MODAL COMPETIÇÃO ── */}
      <Modal visible={modalCompeticao} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalCompeticao(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Competição</Text>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} onPress={() => setModalCompeticao(false)} />
            </View>
            {competicoes.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.modalItem, competicaoSelecionada?.id === c.id && styles.modalItemActive]} onPress={() => { setCompeticaoSelecionada(c); setModalCompeticao(false); }}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color={competicaoSelecionada?.id === c.id ? colors.azulClaro : colors.text_secondary} />
                <Text style={[styles.modalItemText, competicaoSelecionada?.id === c.id && styles.modalItemTextActive]}>{c.nome}</Text>
                {competicaoSelecionada?.id === c.id && <MaterialCommunityIcons name="check" size={18} color={colors.azulClaro} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── MODAL SELEÇÃO DE TIME ── */}
      <Modal visible={modalTime !== null} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => { setModalTime(null); setBuscaTime(''); }}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalTime === 'mandante' ? 'Selecionar Mandante' : 'Selecionar Visitante'}
              </Text>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} onPress={() => { setModalTime(null); setBuscaTime(''); }} />
            </View>

            <View style={[styles.inputRow, { marginBottom: 12 }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.text_secondary} />
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder="Buscar time..."
                placeholderTextColor={colors.text_secondary}
                value={buscaTime}
                onChangeText={setBuscaTime}
                autoFocus
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {carregandoDados ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
              ) : timesFiltrados.length === 0 ? (
                <Text style={{ fontFamily: 'Creato-Regular', color: colors.text_secondary, textAlign: 'center', paddingVertical: 20 }}>
                  Nenhum time encontrado
                </Text>
              ) : (
                timesFiltrados.map((time) => {
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