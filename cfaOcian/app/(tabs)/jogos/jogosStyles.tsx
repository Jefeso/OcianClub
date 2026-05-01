import { StyleSheet } from "react-native";
import { colors } from "@/src/theme/colors";

const MARGEM_CONTEUDO = 20;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, 
  },
  content: {
    paddingTop: 10,
  },
  
  // --- FILTROS (DROPDOWN DE MÊS E PILLS DE CATEGORIA) ---
  filtersContainer: {
    marginBottom: 24,
  },
  filterHeader: {
    paddingHorizontal: MARGEM_CONTEUDO,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  monthSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', 
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  monthSelectorText: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 16,
  },
  pillRow: {
    paddingHorizontal: MARGEM_CONTEUDO,
    gap: 12,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: colors.cinza, 
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: colors.primary, 
  },
  pillText: {
    fontFamily: 'Creato-Bold',
    color: colors.text_secondary,
    fontSize: 14,
  },
  pillTextActive: {
    color: colors.text,
  },

  // --- LISTAGEM E DATAS ---
  daySection: {
    paddingHorizontal: MARGEM_CONTEUDO,
    marginBottom: 10,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBar: {
    width: 4,
    height: 24,
    backgroundColor: colors.primary, 
    marginRight: 10,
    borderRadius: 2,
  },
  dateText: {
    fontFamily: 'Creato-Bold',
    fontSize: 20,
    color: colors.text,
  },

  // --- CARDS DE PARTIDA ---
  matchCard: {
    backgroundColor: '#1a1a1a', 
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  matchCardOcian: {
    borderWidth: 1.5,
    borderColor: colors.azulClaro,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontFamily: 'Creato-Medium',
    color: colors.text,
    fontSize: 14,
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: colors.text_secondary, 
  },
  catText: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary, // Fundo azul escuro elegante para o badge
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 10,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  teamCol: {
    alignItems: 'center',
    width: 90,
    gap: 8,
  },
  teamLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    backgroundColor: colors.background, // Fundo dark por trás da logo pra separar do cinza do card
    borderRadius: 8,
  },
  teamName: {
    fontFamily: 'Creato-Bold',
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  versusText: {
    fontFamily: 'Creato-Bold',
    fontSize: 20,
    color: colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.background, // Linha dark sutil separando o local
    paddingTop: 12,
  },
  locationText: {
    fontFamily: 'Creato-Regular',
    color: colors.text_secondary,
    fontSize: 13,
  },

  // --- BOTÃO FLUTUANTE (FAB) ---
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- MODAL SELETOR DE MÊS ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cinza,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Creato-Bold',
    fontSize: 18,
    color: colors.text,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  monthGridItem: {
    width: '30%', 
    backgroundColor: colors.cinza,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  monthGridItemActive: {
    backgroundColor: colors.primary,
  },
  monthGridText: {
    fontFamily: 'Creato-Medium',
    color: colors.text_secondary,
    fontSize: 14,
  },
  monthGridTextActive: {
    color: colors.text,
    fontFamily: 'Creato-Bold',
  },
});