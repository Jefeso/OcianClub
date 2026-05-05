import { StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

const MARGEM = 20;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: MARGEM,
  },
  sectionLabel: {
    fontFamily: 'Creato-Bold',
    color: colors.azulClaro,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 24,
  },

  // ── Dropdown ─────────────────────────────────────────────
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dropdownText: {
    flex: 1,
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 15,
  },

  // ── Pills categoria ───────────────────────────────────────
  pillRow: {
    gap: 10,
    paddingVertical: 4,
  },
  pill: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 13,
  },
  pillTextActive: {
    color: colors.text,
  },

  // ── Confronto ────────────────────────────────────────────
  confrontoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 140,
    justifyContent: 'center',
  },
  timeCardSelecionado: {
    borderColor: colors.azulClaro,
    backgroundColor: '#0e78ff10',
  },
  addIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCardLabel: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1,
  },
  timeCardSub: {
    fontFamily: 'Creato-Regular',
    color: colors.text_secondary,
    fontSize: 11,
    textAlign: 'center',
  },
  timeCardNome: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
  vsBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginHorizontal: -8,
  },
  vsText: {
    fontFamily: 'Creato-Bold',
    color: '#FFF',
    fontSize: 13,
    letterSpacing: 1,
  },

  // ── Data e Horário ───────────────────────────────────────
  rowDuplo: {
    flexDirection: 'row',
    gap: 14,
  },
  halfBlock: {
    flex: 1,
  },

  // ── Inputs ───────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputText: {
    fontFamily: 'Creato-Regular',
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  explorarText: {
    fontFamily: 'Creato-Bold',
    color: colors.azulClaro,
    fontSize: 12,
    letterSpacing: 0.8,
  },

  // ── Mapa ─────────────────────────────────────────────────
  mapaPlaceholder: {
    marginTop: 14,
    height: 160,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mapaLabel: {
    fontFamily: 'Creato-Bold',
    color: '#333',
    fontSize: 11,
    letterSpacing: 1.2,
  },

  // ── Salvar ───────────────────────────────────────────────
  salvarBtn: {
    marginTop: 32,
    borderRadius: 14,
    overflow: 'hidden',
  },
  salvarGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salvarText: {
    fontFamily: 'Creato-Bold',
    color: '#FFF',
    fontSize: 15,
    letterSpacing: 1.2,
  },

  // ── Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: MARGEM,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalItemActive: {
    backgroundColor: '#0e78ff18',
  },
  modalItemText: {
    fontFamily: 'Creato-Regular',
    color: colors.text_secondary,
    fontSize: 14,
  },
  modalItemTextActive: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
  },
});