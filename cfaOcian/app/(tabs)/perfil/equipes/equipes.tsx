import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Pressable, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { styles } from '@/src/styles/equipesStyles';
import { Header } from '@/src/components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchTimes, fetchCompeticoes, fetchCategorias, fetchJogadores, fetchPartidas,
  criarTime, atualizarTime, deletarTime,
  criarCompeticao, atualizarCompeticao, deletarCompeticao, fetchJogadoresPorCompeticao, salvarElencoCompeticao
} from '@/src/services/api';

interface Categoria { id: number; nome: string; }
interface Time { id: number; nome: string; escudo: string | null; categoria_id: number; }
interface Partida { id: number; categoria_id: number | null; mandante: Time; visitante: Time; }
interface Competicao { id: number; nome: string; ano: number; tipo: 'INICIACAO' | 'BASE'; }
interface Jogador { id: number; nome: string; posicao: string; numCamisa: number | null; categoria_id: number; }
interface EquipesProps { onFechar: () => void; noModal?: boolean; }

const NOME_CLUBE = 'OCIAN';


const ORDEM_SUBS: Record<string, number> = {
  'SUB 7': 1, 'SUB-7': 1, 'SUB 8': 2, 'SUB-8': 2, 'SUB 9': 3, 'SUB-9': 3,
  'SUB 10': 4, 'SUB-10': 4, 'SUB 12': 5, 'SUB-12': 5, 'SUB 14': 6, 'SUB-14': 6,
  'SUB 16': 7, 'SUB-16': 7, 'SUB 18': 8, 'SUB-18': 8,
};

const getTipoCategoria = (nome: string) => {
  const iniciacao = ['SUB 7', 'SUB-7', 'SUB 8', 'SUB-8', 'SUB 9', 'SUB-9', 'SUB 10', 'SUB-10'];
  return iniciacao.includes(nome.toUpperCase()) ? 'INICIACAO' : 'BASE';
};


function EmptyState({ icone, mensagem, onAction, labelAction }: any) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name={icone} size={56} color="#2a2a2a" />
      <Text style={styles.emptyText}>{mensagem}</Text>
      {onAction && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
          <Text style={styles.emptyBtnText}>{labelAction}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function Equipes({ onFechar, noModal }: EquipesProps) {
  const [abaAtiva, setAbaAtiva] = useState<'ocian' | 'adversarios' | 'campeonatos'>('ocian');
  const [tipoOcian, setTipoOcian] = useState<'INICIACAO' | 'BASE'>('INICIACAO');
  const [subSelecionadoId, setSubSelecionadoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  
  const [times, setTimes] = useState<Time[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [modalFormAdversario, setModalFormAdversario] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modalElenco, setModalElenco] = useState(false);
  
  const [itemSelecionado, setItemSelecionado] = useState<Time | Competicao | Categoria | null>(null);
  
  const [salvando, setSalvando] = useState(false);
  const [nomeForm, setNomeForm] = useState('');
  const [anoForm, setAnoForm] = useState('');
  const [escudoUri, setEscudoUri] = useState<string | null>(null);
  const [escudoUrl, setEscudoUrl] = useState<string | null>(null);
  const [categoriaFormId, setCategoriaFormId] = useState<number | null>(null);
  const [tipoForm, setTipoForm] = useState<'INICIACAO' | 'BASE'>('INICIACAO');

  // ── ESTADOS DO WIZARD DE CAMPEONATOS ──
  const [wizardVisivel, setWizardVisivel] = useState(false);
  const [wizardStep, setWizardStep] = useState<'INFO' | 'SUBS' | 'ELENCO' | 'JOGOS'>('INFO');
  const [wizardSubAtivo, setWizardSubAtivo] = useState<Categoria | null>(null);
  const wizardSubRef = React.useRef<Categoria | null>(null);
  const [elencoSelecionado, setElencoSelecionado] = useState<Record<number, number[]>>({});
  const [carregandoElenco, setCarregandoElenco] = useState(false);

  const carregarDados = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const [t, c, cat, jog, p] = await Promise.all([
        fetchTimes(), fetchCompeticoes(), fetchCategorias(), fetchJogadores(), fetchPartidas()
      ]);
      setTimes(t); setCompeticoes(c); setJogadores(jog); setPartidas(p);
      setCategorias(cat.sort((a: Categoria, b: Categoria) => (ORDEM_SUBS[a.nome.toUpperCase()] ?? 99) - (ORDEM_SUBS[b.nome.toUpperCase()] ?? 99)));
    } catch (e) {
      console.error(e);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarDados(); }, [carregarDados]));

  const isOcian = (nome: string) => nome.toUpperCase().includes(NOME_CLUBE);
  const categoriasOcian = categorias.filter(c => getTipoCategoria(c.nome) === tipoOcian);
  const competicoesFiltradas = competicoes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));

  const getAdversariosPorSub = (catId: number) => {
    const mapaTimes = new Map<number, Time>();
    partidas.forEach(p => {
      if (p.categoria_id === catId) {
        if (p.mandante && !isOcian(p.mandante.nome)) mapaTimes.set(p.mandante.id, p.mandante);
        if (p.visitante && !isOcian(p.visitante.nome)) mapaTimes.set(p.visitante.id, p.visitante);
      }
    });
    times.forEach(t => {
      if (!isOcian(t.nome) && t.categoria_id === catId) mapaTimes.set(t.id, t);
    });
    return Array.from(mapaTimes.values());
  };

  // ── FUNÇÕES DO WIZARD DE CAMPEONATOS ──
  const iniciarWizardCampeonato = async (comp?: Competicao) => {
    setItemSelecionado(comp || null);
    setNomeForm(comp?.nome || '');
    setAnoForm(comp ? String(comp.ano) : String(new Date().getFullYear()));
    setTipoForm(comp?.tipo || 'INICIACAO');
    setWizardVisivel(true);

    if (comp) {
      try {
        const jogadoresInscritos: Jogador[] = await fetchJogadoresPorCompeticao(comp.id);
        const elencoInicial: Record<number, number[]> = {};
        jogadoresInscritos.forEach(j => {
          if (!elencoInicial[j.categoria_id]) elencoInicial[j.categoria_id] = [];
          elencoInicial[j.categoria_id].push(j.id);
        });
        setElencoSelecionado(elencoInicial);
        setWizardStep(jogadoresInscritos.length > 0 ? 'SUBS' : 'INFO');
      } catch (e) {
        console.error('Erro ao carregar elenco:', e);
        setElencoSelecionado({});
        setWizardStep('INFO');
      }
    } else {
      setElencoSelecionado({});
      setWizardStep('INFO');
    }
  };

  const avancarWizardParaSubs = async () => {
    if (!nomeForm.trim()) return Alert.alert('Atenção', 'O nome não pode ser vazio.');
    if (!anoForm.trim()) return Alert.alert('Atenção', 'Informe o ano.');
    
    setSalvando(true);
    try {
      // Salva ou atualiza a competição para já garantir ela no banco
      const dados = { nome: nomeForm, ano: Number(anoForm), tipo: tipoForm };
      let comp;
      if (itemSelecionado && 'ano' in itemSelecionado) {
        comp = await atualizarCompeticao(itemSelecionado.id, dados);
      } else {
        comp = await criarCompeticao(dados);
      }
      setItemSelecionado(comp);
      setWizardStep('SUBS');
      carregarDados(true);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const abrirSelecaoElenco = (sub: Categoria) => {
    wizardSubRef.current = sub; // síncrono — disponível imediatamente no render
    setWizardSubAtivo(sub);
    setWizardStep('ELENCO');
  };

  const toggleJogadorElenco = (jogadorId: number) => {
    if (!wizardSubAtivo) return;
    setElencoSelecionado(prev => {
      const atual = prev[wizardSubAtivo.id] || [];
      const novoArray = atual.includes(jogadorId) 
        ? atual.filter(id => id !== jogadorId) 
        : [...atual, jogadorId];
      return { ...prev, [wizardSubAtivo.id]: novoArray };
    });
  };

  // ── FUNÇÕES ADVERSÁRIOS ──
  const abrirFormAdversario = (time?: Time) => {
    setItemSelecionado(time || null); 
    setNomeForm(time?.nome || ''); 
    setEscudoUrl(time?.escudo || null); 
    setEscudoUri(null); 
    setCategoriaFormId(time?.categoria_id || subSelecionadoId || null); 
    setModalFormAdversario(true);
  };

  const escolherImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setEscudoUri(result.assets[0].uri);
  };

  const salvarAdversario = async () => {
    if (!nomeForm.trim()) return Alert.alert('Atenção', 'O nome não pode ser vazio.');
    if (!categoriaFormId) return Alert.alert('Atenção', 'Selecione o Sub a qual este time pertence.');
    
    setSalvando(true);
    try {
      const dados = { nome: nomeForm, escudo: escudoUrl ?? undefined, categoria_id: categoriaFormId };
      if (itemSelecionado && 'escudo' in itemSelecionado) await atualizarTime(itemSelecionado.id, dados); 
      else await criarTime(dados);
      setModalFormAdversario(false); 
      carregarDados();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally { setSalvando(false); }
  };

  const excluir = async () => {
    if (!itemSelecionado) return;
    try {
      if (abaAtiva === 'adversarios') await deletarTime(itemSelecionado.id); 
      else await deletarCompeticao(itemSelecionado.id);
      setModalConfirmar(false); 
      carregarDados();
    } catch (err: any) {
      setModalConfirmar(false); Alert.alert('Erro', err.message);
    }
  };

  // ── RENDERIZADORES DE ABAS ──
  const renderCFAOcian = () => (
    <View>
      <View style={styles.tipoSwitchContainer}>
        {(['INICIACAO', 'BASE'] as const).map(tipo => (
          <TouchableOpacity key={tipo} style={[styles.tipoSwitchBtn, tipoOcian === tipo && styles.tipoSwitchBtnAtivo]} onPress={() => setTipoOcian(tipo)}>
            <Text style={[styles.tipoSwitchTxt, tipoOcian === tipo && styles.tipoSwitchTxtAtivo]}>{tipo === 'INICIACAO' ? 'INICIAÇÃO' : 'BASE'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.gridCategorias}>
        {categoriasOcian.map(cat => (
          <TouchableOpacity key={cat.id} style={styles.cardCategoriaOcian} onPress={() => { setItemSelecionado(cat); setModalElenco(true); }}>
            <View style={styles.iconCircleOcian}><MaterialCommunityIcons name="shield-star" size={32} color={colors.primary} /></View>
            <Text style={styles.catOcianNome}>{cat.nome}</Text>
            <Text style={styles.catOcianBadgeTxt}>{jogadores.filter(j => j.categoria_id === cat.id).length} atletas</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAdversarios = () => {
    if (subSelecionadoId !== null) {
      const adversariosDesseSub = getAdversariosPorSub(subSelecionadoId).filter(t => t.nome.toLowerCase().includes(busca.toLowerCase()));
      return (
        <View>
          <View style={styles.buscaContainer}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.text_secondary} />
            <TextInput style={styles.buscaInput} placeholder="Buscar time..." placeholderTextColor={colors.text_secondary} value={busca} onChangeText={setBusca} />
          </View>
          <TouchableOpacity style={styles.btnVoltarCategorias} onPress={() => { setSubSelecionadoId(null); setBusca(''); }}>
            <MaterialCommunityIcons name="chevron-left" size={20} color={colors.azulClaro} />
            <Text style={styles.txtVoltarCategorias}>VOLTAR PARA CATEGORIAS</Text>
          </TouchableOpacity>
          {adversariosDesseSub.length === 0 ? (
            <EmptyState icone="shield-off-outline" mensagem="Nenhum adversário neste Sub." onAction={() => abrirFormAdversario()} labelAction="Adicionar Time" />
          ) : (
            adversariosDesseSub.map(time => (
              <View key={time.id} style={styles.cardLista}>
                <View style={styles.cardLeft}>
                  {time.escudo ? <Image source={{ uri: time.escudo }} style={styles.escudoLista} /> : (
                    <View style={styles.escudoPlaceholder}><Text style={styles.escudoIniciais}>{time.nome.substring(0, 2).toUpperCase()}</Text></View>
                  )}
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.cardNome}>{time.nome}</Text>
                  </View>
                </View>
                <View style={styles.cardAcoes}>
                  <TouchableOpacity style={styles.btnAcao} onPress={() => abrirFormAdversario(time)}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.azulClaro} /></TouchableOpacity>
                  <TouchableOpacity style={[styles.btnAcao, styles.btnAcaoDanger]} onPress={() => { setItemSelecionado(time); setModalConfirmar(true); }}><MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.vermelho} /></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      );
    }
    return (
      <View>
        <Text style={styles.sectionLabel}>SELECIONE A CATEGORIA PARA VER OS ADVERSÁRIOS</Text>
        <View style={styles.gridCategorias}>
          {categorias.map(cat => {
             const qtdEquipes = getAdversariosPorSub(cat.id).length;
             return (
              <TouchableOpacity key={cat.id} style={styles.cardCategoriaOcian} onPress={() => setSubSelecionadoId(cat.id)}>
                <View style={[styles.iconCircleOcian, { backgroundColor: '#2a2a2a' }]}><MaterialCommunityIcons name="shield-outline" size={28} color={colors.azulClaro} /></View>
                <Text style={styles.catOcianNome}>{cat.nome}</Text>
                <Text style={styles.catOcianBadgeTxt}>{qtdEquipes} equipes</Text>
              </TouchableOpacity>
             );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="EQUIPES" showLogo={false} showProfile={false} btnVoltar="arrow-left" onBtnVoltar={onFechar} semSafeArea={noModal} />

      <View style={styles.segmentedControl}>
        {(['ocian', 'adversarios', 'campeonatos'] as const).map(aba => (
          <TouchableOpacity key={aba} style={[styles.segmentBtn, abaAtiva === aba && styles.segmentBtnAtivo]} onPress={() => { setAbaAtiva(aba); setSubSelecionadoId(null); setBusca(''); }}>
            <Text style={[styles.segmentTxt, abaAtiva === aba && styles.segmentTxtAtivo]}>
              {aba === 'ocian' ? 'CFA OCIAN' : aba === 'adversarios' ? 'ADVERSÁRIOS' : 'CAMPEONATOS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {carregando ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
          abaAtiva === 'ocian' ? renderCFAOcian() : 
          abaAtiva === 'adversarios' ? renderAdversarios() : (
            <View>
              <View style={styles.buscaContainer}>
                <MaterialCommunityIcons name="magnify" size={18} color={colors.text_secondary} />
                <TextInput style={styles.buscaInput} placeholder="Buscar campeonato..." placeholderTextColor={colors.text_secondary} value={busca} onChangeText={setBusca} />
              </View>
              {competicoesFiltradas.length === 0 ? (
                <EmptyState icone="trophy-outline" mensagem="Nenhum campeonato" onAction={() => iniciarWizardCampeonato()} labelAction="Criar Campeonato" />
              ) : (
                competicoesFiltradas.map(comp => (
                  <View key={comp.id} style={styles.cardLista}>
                    <View style={styles.cardLeft}>
                      <View style={styles.escudoPlaceholder}><MaterialCommunityIcons name="trophy-outline" size={20} color={colors.azulClaro} /></View>
                      <View style={{ flexShrink: 1 }}>
                      <Text style={styles.cardNome} numberOfLines={2}>{comp.nome}</Text>
                      <Text style={styles.cardSub}>{comp.ano} • {comp.tipo}</Text>
                    </View>
                    </View>
                    <View style={styles.cardAcoes}>
                      <TouchableOpacity style={styles.btnAcao} onPress={() => iniciarWizardCampeonato(comp)}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.azulClaro} /></TouchableOpacity>
                      <TouchableOpacity style={[styles.btnAcao, styles.btnAcaoDanger]} onPress={() => { setItemSelecionado(comp); setModalConfirmar(true); }}><MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.vermelho} /></TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {abaAtiva !== 'ocian' && (abaAtiva === 'campeonatos' || (abaAtiva === 'adversarios' && subSelecionadoId !== null)) && (
        <TouchableOpacity style={styles.fab} onPress={() => abaAtiva === 'campeonatos' ? iniciarWizardCampeonato() : abrirFormAdversario()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* ── MODAL ELENCO OCIAN (SOMENTE LEITURA) ── */}
      <Modal visible={modalElenco} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setModalElenco(false)}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Elenco {itemSelecionado?.nome}</Text>
              <TouchableOpacity onPress={() => setModalElenco(false)}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            
            {jogadores.filter(j => j.categoria_id === itemSelecionado?.id).length === 0 ? (
              <EmptyState icone="account-group-outline" mensagem="Nenhum atleta cadastrado neste sub." />
            ) : (
              <FlatList
                data={jogadores.filter(j => j.categoria_id === itemSelecionado?.id)}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.cardJogadorModal}>
                    <View style={styles.jogadorCamisa}><Text style={styles.jogadorCamisaTxt}>{item.numCamisa ?? '-'}</Text></View>
                    <View><Text style={styles.jogadorNome}>{item.nome}</Text><Text style={styles.jogadorPosicao}>{item.posicao}</Text></View>
                  </View>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── MODAL FORM ADVERSÁRIOS ── */}
      <Modal visible={modalFormAdversario} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setModalFormAdversario(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{itemSelecionado ? 'Editar' : 'Novo'} Adversário</Text>
              <TouchableOpacity onPress={() => setModalFormAdversario(false)}><MaterialCommunityIcons name="close" size={22} color={colors.text} /></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.escudoPicker} onPress={escolherImagem}>
              {escudoUri || escudoUrl ? <Image source={{ uri: escudoUri || escudoUrl || '' }} style={styles.escudoPickerImg} /> : (
                <><MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.text_secondary} /><Text style={styles.escudoPickerTxt}>Adicionar escudo</Text></>
              )}
            </TouchableOpacity>
            <Text style={styles.modalSubtitulo}>Selecione a categoria do adversário:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {categorias.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.pill, categoriaFormId === cat.id && styles.pillActive]} onPress={() => setCategoriaFormId(cat.id)}>
                  <Text style={[styles.pillText, categoriaFormId === cat.id && styles.pillTextActive]}>{cat.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="shield-outline" size={18} color={colors.text_secondary} />
              <TextInput style={styles.input} placeholder="Nome do Time" placeholderTextColor={colors.text_secondary} value={nomeForm} onChangeText={setNomeForm} />
            </View>

            <TouchableOpacity style={styles.btnSalvar} onPress={salvarAdversario} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSalvarTxt}>SALVAR</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── WIZARD DE CAMPEONATOS ── */}
      <Modal visible={wizardVisivel} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setWizardVisivel(false)}>
          <Pressable style={[styles.modalCard, { maxHeight: '90%' }]}>
            
            {/* Header do Wizard com botão voltar contextual */}
            <View style={styles.modalHeader}>
              {wizardStep !== 'INFO' ? (
                <TouchableOpacity onPress={() => {
                  if (wizardStep === 'SUBS') setWizardStep('INFO');
                  else if (wizardStep === 'ELENCO') setWizardStep('SUBS');
                  else if (wizardStep === 'JOGOS') setWizardStep('SUBS');
                }} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 30 }} />
              )}
              <Text style={styles.modalTitulo}>
                {wizardStep === 'INFO' ? 'Dados do Torneio' :
                 wizardStep === 'SUBS' ? 'Escalar Categorias' :
                 wizardStep === 'ELENCO' ? `Súmula: ${(wizardSubAtivo ?? wizardSubRef.current)?.nome}` : 'Tabela de Jogos'}
              </Text>
              <TouchableOpacity onPress={() => setWizardVisivel(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.wizardProgress}>
              {['INFO', 'SUBS', 'JOGOS'].map((step, index) => (
                <View key={step} style={[styles.wizardDot, (wizardStep === step || (wizardStep === 'ELENCO' && step === 'SUBS')) && styles.wizardDotActive]} />
              ))}
            </View>

            {/* CONTEÚDO: PASSO 1 - INFO */}
            {wizardStep === 'INFO' && (
              <View>
                <Text style={styles.modalSubtitulo}>Qual a faixa etária do campeonato?</Text>
                <View style={[styles.tipoSwitchContainer, { marginBottom: 16 }]}>
                    <TouchableOpacity style={[styles.tipoSwitchBtn, tipoForm === 'INICIACAO' && styles.tipoSwitchBtnAtivo]} onPress={() => setTipoForm('INICIACAO')}>
                        <Text style={[styles.tipoSwitchTxt, tipoForm === 'INICIACAO' && styles.tipoSwitchTxtAtivo]}>INICIAÇÃO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tipoSwitchBtn, tipoForm === 'BASE' && styles.tipoSwitchBtnAtivo]} onPress={() => setTipoForm('BASE')}>
                        <Text style={[styles.tipoSwitchTxt, tipoForm === 'BASE' && styles.tipoSwitchTxtAtivo]}>BASE</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.inputRow, { marginBottom: 12 }]}>
                  <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.text_secondary} />
                  <TextInput style={styles.input} placeholder="Nome do Campeonato" placeholderTextColor={colors.text_secondary} value={nomeForm} onChangeText={setNomeForm} />
                </View>

                <View style={[styles.inputRow, { marginBottom: 24 }]}>
                  <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.text_secondary} />
                  <TextInput style={styles.input} placeholder="Ano" placeholderTextColor={colors.text_secondary} value={anoForm} onChangeText={setAnoForm} keyboardType="numeric" maxLength={4} />
                </View>

                <TouchableOpacity style={styles.btnSalvar} onPress={avancarWizardParaSubs} disabled={salvando}>
                  {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSalvarTxt}>SALVAR E AVANÇAR</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* CONTEÚDO: PASSO 2 - SELECIONAR SUBS */}
            {wizardStep === 'SUBS' && (
              <View>
                <Text style={[styles.sectionLabel, { marginBottom: 16 }]}>QUAIS SUBS IRÃO COMPETIR?</Text>
                <View style={styles.gridCategorias}>
                  {categorias.filter(c => getTipoCategoria(c.nome) === tipoForm).map(cat => {
                    const totalSelecionados = elencoSelecionado[cat.id]?.length || 0;
                    return (
                      <TouchableOpacity key={cat.id} style={styles.cardCategoriaOcian} onPress={() => abrirSelecaoElenco(cat)}>
                        <View style={[styles.iconCircleOcian, { backgroundColor: totalSelecionados > 0 ? colors.primary + '22' : '#2a2a2a' }]}>
                          <MaterialCommunityIcons name={totalSelecionados > 0 ? "check-all" : "account-group-outline"} size={28} color={totalSelecionados > 0 ? colors.primary : colors.azulClaro} />
                        </View>
                        <Text style={styles.catOcianNome}>{cat.nome}</Text>
                        <Text style={[styles.catOcianBadgeTxt, totalSelecionados > 0 && { color: colors.primary }]}>
                          {totalSelecionados} selecionados
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <TouchableOpacity style={[styles.btnSalvar, { marginTop: 24 }]} onPress={() => setWizardStep('JOGOS')}>
                  <Text style={styles.btnSalvarTxt}>IR PARA TABELA DE JOGOS</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* CONTEÚDO: PASSO 3 - CHECKLIST DO ELENCO */}
            {wizardStep === 'ELENCO' && (() => {
              const subAtivo = wizardSubAtivo ?? wizardSubRef.current;
              if (!subAtivo) return null;
              const jogadoresDosub = jogadores.filter(j => Number(j.categoria_id) === Number(subAtivo.id));
              return (
                <View style={{ minHeight: 300 }}>
                  <Text style={[styles.modalSubtitulo, { marginBottom: 12 }]}>
                    Marque quem vai pra súmula oficial:
                  </Text>
                  {jogadoresDosub.length === 0 ? (
                    <EmptyState icone="account-group-outline" mensagem={`Nenhum atleta no ${subAtivo.nome}.`} />
                  ) : (
                    <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {jogadoresDosub.map(item => {
                        const selecionado = !!(elencoSelecionado[subAtivo.id]?.includes(item.id));
                        return (
                          <TouchableOpacity
                            key={item.id.toString()}
                            style={[styles.cardJogadorModal, selecionado && { borderColor: colors.primary, backgroundColor: colors.primary + '11' }]}
                            onPress={() => toggleJogadorElenco(item.id)}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name={selecionado ? "checkbox-marked" : "checkbox-blank-outline"}
                              size={24}
                              color={selecionado ? colors.primary : colors.text_secondary}
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.jogadorNome}>{item.nome}</Text>
                              <Text style={styles.jogadorPosicao}>{item.posicao} • #{item.numCamisa}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  <TouchableOpacity
                    style={[styles.btnSalvar, { marginTop: 12 }]}
                    disabled={carregandoElenco}
                    onPress={async () => {
                      if (itemSelecionado && 'ano' in itemSelecionado) {
                        setCarregandoElenco(true);
                        try {
                          const todosIds = Object.values(elencoSelecionado).flat() as number[];
                          await salvarElencoCompeticao(itemSelecionado.id, todosIds);
                        } catch (e: any) {
                          Alert.alert('Erro', e.message || 'Não foi possível salvar o elenco.');
                        } finally {
                          setCarregandoElenco(false);
                        }
                      }
                      setWizardStep('SUBS');
                    }}
                  >
                    {carregandoElenco
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={styles.btnSalvarTxt}>CONFIRMAR ELENCO</Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* CONTEÚDO: PASSO 4 - OPÇÕES DE JOGO */}
            {wizardStep === 'JOGOS' && (
              <View style={{ gap: 16, paddingVertical: 10 }}>
                <TouchableOpacity style={styles.wizardOptionCard} onPress={() => { setWizardVisivel(false); Alert.alert('Aviso', 'Redirecionando para a aba de Jogos...'); }}>
                  <View style={styles.wizardOptionIcon}><MaterialCommunityIcons name="calendar-edit" size={32} color={colors.azulClaro} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wizardOptionTitle}>Criação Manual</Text>
                    <Text style={styles.wizardOptionSub}>Adicione os jogos da rodada um por um, definindo o adversário e horário.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.wizardOptionCard, { borderColor: colors.primary }]} onPress={() => Alert.alert('Importar IA', 'O módulo de leitura inteligente de PDF/CSV da federação estará disponível na próxima atualização!')}>
                  <View style={[styles.wizardOptionIcon, { backgroundColor: colors.primary + '22' }]}><MaterialCommunityIcons name="robot-outline" size={32} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wizardOptionTitle, { color: colors.primary }]}>Importar IA Mágica</Text>
                    <Text style={styles.wizardOptionSub}>Envie a tabela em PDF da federação e nós criamos todos os jogos pra você.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btnNao, { marginTop: 12 }]} onPress={() => { setWizardVisivel(false); carregarDados(); }}>
                  <Text style={styles.txtNao}>FINALIZAR DEPOIS</Text>
                </TouchableOpacity>
              </View>
            )}

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL CONFIRMAR EXCLUSÃO ── */}
      <Modal visible={modalConfirmar} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalConfirmar(false)}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <MaterialCommunityIcons name="trash-can-outline" size={36} color={colors.vermelho} style={{ marginBottom: 8 }} />
            <Text style={styles.modalTitulo}>Excluir</Text>
            <Text style={styles.modalSubtitulo}>Tem certeza que deseja excluir "{itemSelecionado?.nome}"?</Text>
            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.btnNao} onPress={() => setModalConfirmar(false)}><Text style={styles.txtNao}>CANCELAR</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSim} onPress={excluir}><Text style={styles.txtSim}>EXCLUIR</Text></TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}