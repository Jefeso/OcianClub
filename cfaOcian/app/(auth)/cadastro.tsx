import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/src/services/api'; 
import { colors } from '@/src/theme/colors'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './cadastroStyles'

export default function Cadastro() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = async () => {
    if (!email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem!');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(`${BASE_URL}/auth/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, role: 'USER' })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.error || 'Erro ao criar conta.');
      }

      Alert.alert('Sucesso!', 'Sua conta foi criada. Faça login para continuar.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>

        <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>

        <MaterialCommunityIcons name="account-plus-outline" size={70} color="#009FFF" style={{ marginBottom: 15 }} />
        
        <Text style={styles.titulo}>Criar Conta</Text>
        <Text style={styles.subtitulo}>Junte-se ao CFA Ocian</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#888"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          <TouchableOpacity 
            style={styles.btnEntrar} 
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.txtBtnEntrar}>CADASTRAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnCadastro} 
            onPress={() => router.back()}
          >
            <Text style={styles.txtCadastro}>Já tem uma conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}