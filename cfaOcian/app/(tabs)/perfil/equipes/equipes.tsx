import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { styles } from './equipesStyles';
import { Header } from '@/src/components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchTimes, fetchCompeticoes,
  criarTime, atualizarTime, deletarTime,
  criarCompeticao, atualizarCompeticao, deletarCompeticao,
} from '@/src/services/api';

interface Time { id: number; nome: string; escudo: string | null; }
interface Competicao { id: number; nome: string; ano: number; }
interface EquipesProp { onFechar: () => void; noModal?: boolean; }

function EmptyState({ icone, mensagem, onAction, labelAction }: {
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  mensagem: string;
  onAction: () => void;
  labelAction: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name={icone} size={56} color="#2a2a2a" />
      <Text style={styles.emptyText}>{mensagem}</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
        <Text style={styles.emptyBtnText}>{labelAction}</Text>
      </TouchableOpacity>
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonEscudo} />
      <View style={styles.skeletonTextoContainer}>
        <View style={styles.skeletonTitulo} />
        <View style={styles.skeletonSubtitulo} />
      </View>
    </View>
  );
}

export default function Equipes({ onFechar, noModal }: EquipesProp) {
  const [abaAtiva, setAbaAtiva] = useState<'times' | 'campeonatos'>('times');
  const [times, setTimes] = useState<Time[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  const [modalForm, setModalForm] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<Time | Competicao | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [nomeForm, setNomeForm] = useState('');
  const [anoForm, setAnoForm] = useState('');
  const [escudoUri, setEscudoUri] = useState<string | null>(null);
  const [escudoUrl, setEscudoUrl] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [t, c] = await Promise.all([fetchTimes(), fetchCompeticoes()]);
      setTimes(t);
      setCompeticoes(c);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarDados(); }, [carregarDados]));

  const abrirFormNovo = () => {
    setItemSelecionado(null);
    setNomeForm('');
    setAnoForm(String(new Date().getFullYear()));
    setEscudoUri(null);
    setEscudoUrl(null);
    setModalForm(true);
  };

  const abrirFormEdicao = (item: Time | Competicao) => {
    setItemSelecionado(item);
    setNomeForm(item.nome);
    if ('ano' in item) setAnoForm(String(item.ano));
    if ('escudo' in item) { setEscudoUrl(item.escudo); setEscudoUri(null); }
    setModalForm(true);
  };

  const abrirConfirmarExclusao = (item: Time | Competicao) => {
    setItemSelecionado(item);
    setModalConfirmar(true);
  };

  const escolherImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setEscudoUri(result.assets[0].uri);
  };

  const salvar = async () => {
    if (!nomeForm.trim()) {
      Alert.alert('Atenção', 'O nome não pode ser vazio.');
      return;
    }
    setSalvando(true);
    try {
      if (abaAtiva === 'times') {
        const dados = { nome: nomeForm, escudo: escudoUrl ?? undefined };
        if (itemSelecionado) {
          await atualizarTime(itemSelecionado.id, dados);
        } else {
          await criarTime(dados);
        }
      } else {
        const dados = { nome: nomeForm, ano: Number(anoForm) || new Date().getFullYear() };
        if (itemSelecionado) {
          await atualizarCompeticao(itemSelecionado.id, dados);
        } else {
          await criarCompeticao(dados);
        }
      }
      setModalForm(false);
      carregarDados();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!itemSelecionado) return;
    try {
      if (abaAtiva === 'times') {
        await deletarTime(itemSelecionado.id);
      } else {
        await deletarCompeticao(itemSelecionado.id);
      }
      setModalConfirmar(false);
      carregarDados();
    } catch (err: any) {
      setModalConfirmar(false);
      Alert.alert('Não foi possível excluir', err.message);
    }
  };

  const timesFiltrados = times.filter(t => t.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <View style={styles.container}>
      <Header
        title="MINHAS EQUIPES"
        showLogo={false}
        showProfile={false}
        btnVoltar="arrow-left"
        onBtnVoltar={onFechar}
        semSafeArea={noModal}
      />

      <View style={styles.segmentedControl}>
        {(['times', 'campeonatos'] as const).map(aba => (
          <TouchableOpacity
            key={aba}
            style={[styles.segmentBtn, abaAtiva === aba && styles.segmentBtnAtivo]}
            onPress={() => setAbaAtiva(aba)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentTxt, abaAtiva === aba && styles.segmentTxtAtivo]}>
              {aba === 'times' ? 'TIMES' : 'CAMPEONATOS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {abaAtiva === 'times' && (
        <View style={styles.buscaContainer}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.text_secondary} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar time..."
            placeholderTextColor={colors.text_secondary}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialCommunityIcons name="close" size={16} color={colors.text_secondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {carregando ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : abaAtiva === 'times' ? (
          timesFiltrados.length === 0 ? (
            <EmptyState
              icone="shield-off-outline"
              mensagem="Nenhum time cadastrado ainda"
              onAction={abrirFormNovo}
              labelAction="Adicionar Time"
            />
          ) : (
            timesFiltrados.map(time => (
              <View key={time.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  {time.escudo ? (
                    <Image source={{ uri: time.escudo }} style={styles.escudo} />
                  ) : (
                    <View style={styles.escudoPlaceholder}>
                      <Text style={styles.escudoIniciais}>
                        {time.nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.cardNome}>{time.nome}</Text>
                </View>
                <View style={styles.cardAcoes}>
                  <TouchableOpacity style={styles.btnAcao} onPress={() => abrirFormEdicao(time)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.azulClaro} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnAcao, styles.btnAcaoDanger]} onPress={() => abrirConfirmarExclusao(time)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.vermelho} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          competicoes.length === 0 ? (
            <EmptyState
              icone="trophy-outline"
              mensagem="Nenhum campeonato cadastrado ainda"
              onAction={abrirFormNovo}
              labelAction="Adicionar Campeonato"
            />
          ) : (
            competicoes.map(comp => (
              <View key={comp.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.escudoPlaceholder}>
                    <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.azulClaro} />
                  </View>
                  <View>
                    <Text style={styles.cardNome}>{comp.nome}</Text>
                    <Text style={styles.cardAno}>{comp.ano}</Text>
                  </View>
                </View>
                <View style={styles.cardAcoes}>
                  <TouchableOpacity style={styles.btnAcao} onPress={() => abrirFormEdicao(comp)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.azulClaro} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnAcao, styles.btnAcaoDanger]} onPress={() => abrirConfirmarExclusao(comp)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.vermelho} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={abrirFormNovo} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalForm} transparent animationType="slide" onRequestClose={() => setModalForm(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalForm(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                {itemSelecionado
                  ? (abaAtiva === 'times' ? 'Editar Time' : 'Editar Campeonato')
                  : (abaAtiva === 'times' ? 'Novo Time' : 'Novo Campeonato')}
              </Text>
              <TouchableOpacity onPress={() => setModalForm(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {abaAtiva === 'times' && (
              <TouchableOpacity style={styles.escudoPicker} onPress={escolherImagem} activeOpacity={0.8}>
                {escudoUri ? (
                  <Image source={{ uri: escudoUri }} style={styles.escudoPickerImg} />
                ) : escudoUrl ? (
                  <Image source={{ uri: escudoUrl }} style={styles.escudoPickerImg} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.text_secondary} />
                    <Text style={styles.escudoPickerTxt}>Adicionar escudo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.inputRow}>
              <MaterialCommunityIcons name={abaAtiva === 'times' ? 'shield-outline' : 'trophy-outline'} size={18} color={colors.text_secondary} />
              <TextInput
                style={styles.input}
                placeholder="Nome"
                placeholderTextColor={colors.text_secondary}
                value={nomeForm}
                onChangeText={setNomeForm}
              />
            </View>

            {abaAtiva === 'campeonatos' && (
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.text_secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ano"
                  placeholderTextColor={colors.text_secondary}
                  value={anoForm}
                  onChangeText={setAnoForm}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            )}

            <TouchableOpacity style={styles.btnSalvar} onPress={salvar} activeOpacity={0.8} disabled={salvando}>
              {salvando
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnSalvarTxt}>SALVAR</Text>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={modalConfirmar} transparent animationType="fade" onRequestClose={() => setModalConfirmar(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalConfirmar(false)}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="trash-can-outline" size={36} color={colors.vermelho} style={{ marginBottom: 8 }} />
            <Text style={styles.modalTitulo}>Excluir</Text>
            <Text style={styles.modalSubtitulo}>
              Tem certeza que deseja excluir "{itemSelecionado?.nome}"? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.btnNao} onPress={() => setModalConfirmar(false)} activeOpacity={0.8}>
                <Text style={styles.txtNao}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSim} onPress={excluir} activeOpacity={0.8}>
                <Text style={styles.txtSim}>EXCLUIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}