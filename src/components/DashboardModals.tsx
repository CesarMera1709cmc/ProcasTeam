import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Goal } from '../services/GoalService';

// Props para CategoryGoalsModal
interface CategoryGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  category: { title: string; goals: Goal[]; color: string } | null;
}

export const CategoryGoalsModal: React.FC<CategoryGoalsModalProps> = ({ visible, onClose, category }) => {
  if (!category) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: category.color }]}>{category.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#718096" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {category.goals.map(goal => (
              <View key={goal.id} style={[styles.modalGoalCard, { borderLeftColor: category.color }]}>
                <View style={styles.modalGoalInfo}>
                  <Text style={styles.modalGoalTitle}>{goal.title}</Text>
                  {goal.description ? <Text style={styles.modalGoalDescription}>{goal.description}</Text> : null}
                </View>
                <Text style={styles.modalGoalPoints}>+{goal.points} pts</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Props para GoalDetailModal
interface GoalDetailModalProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
  onComplete: () => void;
  onIncomplete: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ visible, onClose, goal, onComplete, onIncomplete }) => {
  if (!goal) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.goalDetailModalContainer}>
        <View style={styles.goalDetailModalContent}>
          <Text style={styles.goalDetailTitle}>{goal.title}</Text>
          
          {goal.description && (
            <Text style={styles.goalDetailDescription}>{goal.description}</Text>
          )}

          <View style={styles.goalDetailInfo}>
            <View style={styles.infoItem}>
              <Feather name="award" size={16} color="#F6AD55" />
              <Text style={styles.infoText}>+{goal.points} Puntos</Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="repeat" size={16} color="#4299E1" />
              <Text style={styles.infoText}>{goal.frequency === 'once' ? 'Una vez' : 'Diaria'}</Text>
            </View>
          </View>

          <Text style={styles.modalPrompt}>¿Qué pasó con tu meta?</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.incompleteButton]} onPress={onIncomplete}>
              <Feather name="x" size={16} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>No la completé</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.completeButton]} onPress={onComplete}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>Sí la completé</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Estilos del Modal de Categoría
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalGoalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
    borderLeftWidth: 4,
    marginBottom: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  modalGoalInfo: {
    flex: 1,
  },
  modalGoalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  modalGoalDescription: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  modalGoalPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38A169',
    marginLeft: 12,
  },
  // Estilos del Modal de Detalle de Meta
  goalDetailModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  goalDetailModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  goalDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 12,
  },
  goalDetailDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  goalDetailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  modalPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#38A169',
  },
  incompleteButton: {
    backgroundColor: '#E53E3E',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
  },
});
