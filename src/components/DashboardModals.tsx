import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
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
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { borderLeftColor: category.color }]}>
                <Text style={styles.modalTitle}>{category.title}</Text>
                <TouchableOpacity onPress={onClose}>
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{goal.title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Feather name="x" size={24} color="#718096" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                <Text style={styles.goalPoints}>Puntos: {goal.points}</Text>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.button, styles.incompleteButton]} onPress={onIncomplete}>
                  <Text style={styles.buttonText}>No completada</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.completeButton]} onPress={onComplete}>
                  <Text style={styles.buttonText}>¡Completada!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  modalBody: {
    marginBottom: 24,
  },
  goalDescription: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 12,
  },
  goalPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#38A169',
    marginLeft: 8,
  },
  incompleteButton: {
    backgroundColor: '#E53E3E',
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    