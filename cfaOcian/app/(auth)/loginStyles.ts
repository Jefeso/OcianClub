import { StyleSheet, Dimensions } from "react-native";
import { colors } from "@/src/theme/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  btnEntrar: {
    backgroundColor: '#009FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  txtBtnEntrar: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnCadastro: {
    marginTop: 20,
    alignItems: 'center',
  },
  txtCadastro: {
    color: '#009FFF',
    fontSize: 14,
  }
});