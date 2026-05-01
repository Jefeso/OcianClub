import { StyleSheet, Dimensions } from "react-native";
import { colors } from "@/src/theme/colors";

const { width: windowWidth } = Dimensions.get('window');
const MARGEM_CONTEUDO = 16;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  pagerView: {
    flex: 1,
  },

  // ── Toggle ──────────────────────────────────────────────
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: MARGEM_CONTEUDO,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  toggleTextActive: {
    color: colors.text,
    letterSpacing: 0.8,
  },

  // ── Tabela ───────────────────────────────────────────────
  tableContainer: {
    marginHorizontal: MARGEM_CONTEUDO,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  thText: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  tableRowOcian: {
    backgroundColor: '#0e78ff12',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },

  // ── Barra lateral série ──────────────────────────────────
  serieBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },

  // ── Células ──────────────────────────────────────────────
  tdText: {
    fontFamily: 'Creato-Regular',
    color: colors.text,
    fontSize: 13,
  },
  colPos: {
    width: 36,
    paddingLeft: 10,
  },
  colPosText: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 13,
  },
  colClube: {
    flex: 1,
  },
  colStat: {
    width: 28,
    textAlign: 'center',
  },
  colStatDestaque: {
    fontFamily: 'Creato-Bold',
    fontSize: 13,
  },

  // ── Clube ────────────────────────────────────────────────
  clubeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clubeIcone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0e78ff22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubeIniciais: {
    fontFamily: 'Creato-Bold',
    color: colors.azulClaro,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  clubeTextoContainer: {
    flex: 1,
  },
  clubeText: {
    fontFamily: 'Creato-Regular',
    color: colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
  ocianTextBold: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
  },
  ocianHighlightColor: {
    color: colors.azulClaro,
    fontFamily: 'Creato-Bold',
  },

  // ── Legenda ──────────────────────────────────────────────
  legendContainer: {
    marginHorizontal: MARGEM_CONTEUDO,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  legendTitle: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '46%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});