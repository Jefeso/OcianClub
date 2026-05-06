import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/src/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './loginStyles'

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }
    setCarregando(true);
    try {
      // 1. Bate na rota do seu backend Node
      const resposta = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados.error || 'Erro ao fazer login');
      }
      // 2. Salva o Token de forma segura no celular
      await SecureStore.setItemAsync('userToken', dados.token);
      await SecureStore.setItemAsync('userRole', dados.role);
      await SecureStore.setItemAsync('userName', dados.nome); 
      await SecureStore.setItemAsync('userCriadoEm', dados.criadoEm);
      await SecureStore.setItemAsync('userEmail', dados.email); 

      // 3. Joga o usuário para dentro do app e impede de voltar para o login
      router.replace('/(tabs)');

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Ícone ou Logo do CFA Ocian aqui */}
      <MaterialCommunityIcons name="soccer" size={80} color="#009FFF" style={{ marginBottom: 20 }} />
      
      <Text style={styles.titulo}>Bem-vindo de volta!</Text>
      <Text style={styles.subtitulo}>Faça login para acessar o painel</Text>

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

        <TouchableOpacity 
          style={styles.btnEntrar} 
          onPress={handleLogin}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.txtBtnEntrar}>ENTRAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnCadastro} 
          onPress={() => router.push('/cadastro')}
        >
          <Text style={styles.txtCadastro}>Não tem uma conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}