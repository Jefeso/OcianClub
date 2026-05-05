import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { useState, useEffect } from 'react'
import { styles } from "./perfilStyles";
import { Header } from '@/src/components/Header' 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store';

const MEU_PERFIL = [
{id: 1, titulo: "Dados Pessoais", subtitulo: "Gerencie suas informações básicas",  icone: "account-outline" },
{id: 2, titulo: "Minhas equipes", subtitulo: "Visualize seus times e campeonatos", icone: "account-group" },
{id: 3, titulo: "Notificações",   subtitulo: "Preferências de alertas e avisos",   icone: "bell" },
]

interface CardMenuProps{
    titulo: string;
    subtitulo: string;
    icone: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
}

function CardsMeuPerfil({ titulo, subtitulo, icone, onPress }: CardMenuProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer} activeOpacity={0.6}>
        <View style={styles.card}>
            <View style={styles.cardSpace}>
                <View style={{backgroundColor: colors.cinza, padding: 8, borderRadius: 10}}>
                    <MaterialCommunityIcons name={icone} size={26} color={colors.azulClaro} />
                </View>
                <View style={styles.cardText}>
                    <Text style={styles.titulo}>{titulo}</Text>
                    <Text style={styles.subtitulo}>{subtitulo}</Text>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.cinza_claro} />
        </View>
    </TouchableOpacity>
  );
}

export default function Perfil(){

    const [nome, setNome] = useState('');

    const deslogar = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userName');
    router.replace('/(auth)/login');
    };

    useEffect(() => {
    SecureStore.getItemAsync('userName').then(n => {
        if (n) setNome(n);
    });
    }, []);

    const [membroDesde, setMembroDesde] = useState('');

    useEffect(() => {
    SecureStore.getItemAsync('userCriadoEm').then(data => {
        if (data) {
        const formatted = new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        setMembroDesde(formatted);
        }
    });
    }, []);

    const [visivel, setVisivel] = useState(false);

    return(
        <View style={styles.container}>
            <Header title="Meu Perfil" showLogo={false} showProfile={false} btnVoltar="arrow-left" />
            <View style={styles.content}>
                <View style={styles.contentSecundario}>
                    <View style={styles.headerPerfil}>
                    <Text style={styles.nomeUsuario}>{nome}</Text>
                    <Text style={styles.dataMembro}>Membro desde {membroDesde}</Text>
                </View>

                    <View>
                        {MEU_PERFIL.map(item => (
                            <CardsMeuPerfil
                            key={item.id}
                            titulo={item.titulo}
                            subtitulo={item.subtitulo}
                            icone={item.icone}
                            onPress={() => console.log('clicou em', item.titulo)}
                            />
                        ))}
                    </View>
                    <TouchableOpacity style={styles.btnSair} activeOpacity={0.8} onPress={() => setVisivel(true)}>
                        <MaterialCommunityIcons name="logout" size={24} color={colors.vermelho} />
                        <Text style={styles.txtSair}>SAIR DA CONTA</Text>
                    </TouchableOpacity>
                        
                    <Modal
                    visible={visivel}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setVisivel(false)}
                    >
                    <Pressable style={styles.modalOverlay} onPress={() => setVisivel(false)}>
                        <View style={styles.modalCard}>

                        <MaterialCommunityIcons name="logout" size={36} color={colors.vermelho} style={{ marginBottom: 8 }} />

                        <Text style={styles.modalTitulo}>Sair da conta</Text>
                        <Text style={styles.modalSubtitulo}>Tem certeza que deseja encerrar sua sessão?</Text>

                        <View style={styles.modalBotoes}>
                            <TouchableOpacity style={styles.btnNao} onPress={() => setVisivel(false)} activeOpacity={0.8}>
                            <Text style={styles.txtNao}>CANCELAR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnSim} onPress={deslogar} activeOpacity={0.8}>
                            <Text style={styles.txtSim}>SAIR</Text>
                            </TouchableOpacity>
                        </View>

                        </View>
                    </Pressable>
                    </Modal>
                </View>
            </View>
        </View>
    )
}