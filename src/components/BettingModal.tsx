import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Slider from '@react-native-community/slider';
import { Goal, GoalService, Bet } from '../services/GoalService';
import { StoredUser } from '../services/UserService';

interface BettingModalProps {
  visible: boolean;
  onClose: () => void;
  onBetPlaced: () => void;
  goal: Goal | null;
  currentUser: StoredUser | null;
}

export const BettingModal: React.FC<BettingModalProps> = ({ visible, onClose, onBetPlaced, goal, currentUser }) => {
  const [betType, setBetType] = useState<'for' | 'against' | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  if (!goal || !currentUser) return null;

  const handlePlaceBet = async () => {
    if (!betType) {
      Alert.alert('Selecciona una opción', 'Debes elegir si crees que lo logrará o no.');
      return;
    }
    if (currentUser.points < betAmount) {
      Alert.alert('Puntos insuficientes', `No tienes los ${betAmount} puntos necesarios para esta apuesta.`);
      return;
    }

    setIsLoading(true);
    try {
      const bet: Bet = {
        userId: currentUser.id,
        betType,
        amount: betAmount,
      };
      await GoalService.addBetToGoal(goal.id, bet);
      
      Alert.alert(
        '¡Apuesta realizada!',
        `Has apostado ${betAmount} puntos a que ${betType === 'for' ? 'SÍ' : 'NO'} se cumplirá la meta.`,
        [{ text: 'Entendido', onPress: () => {
          onBetPlaced();
          handleClose();
        }}]
      );
    } catch (error) {
      console.error('Error placing bet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error.';
      Alert.alert('Error al apostar', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBetType(null);
    setBetAmount(10);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Feather name="x" size={24} color="#718096" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Apostar en Compromiso</Text>
          <Text style={styles.goalTitle}>"{goal.title}"</Text>

          <Text style={styles.label}>¿Crees que lo logrará?</Text>
          <View style={styles.betTypeContainer}>
            <TouchableOpacity 
              style={[styles.betTypeButton, betType === 'for' && styles.betTypeForSelected]}
              onPress={() => setBetType('for')}
            >
              <Feather name="thumbs-up" size={20} color={betType === 'for' ? '#FFFFFF' : '#38A169'} />
              <Text style={[styles.betTypeText, betType === 'for' && styles.betTypeTextSelected]}>SÍ lo logrará</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.betTypeButton, betType === 'against' && styles.betTypeAgainstSelected]}
              onPress={() => setBetType('against')}
            >
              <Feather name="thumbs-down" size={20} color={betType === 'against' ? '#FFFFFF' : '#E53E3E'} />
              <Text style={[styles.betTypeText, betType === 'against' && styles.betTypeTextSelected]}>NO lo logrará</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>¿Cuántos puntos quieres apostar?</Text>
          <Text style={styles.amountText}>{betAmount} pts</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={5}
            maximumValue={20}
            step={1}
            value={betAmount}
            onValueChange={setBetAmount}
            minimumTrackTintColor="#ED8936"
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor="#ED8936"
          />
          <Text style={styles.balanceText}>Tu balance: {currentUser.points} pts</Text>

          <TouchableOpacity 
            style={[styles.confirmButton, (!betType || isLoading) && styles.confirmButtonDisabled]}
            onPress={handlePlaceBet}
            disabled={!betType || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Apuesta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  betTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  betTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  betTypeForSelected: {
    backgroundColor: '#38A169',
    borderColor: '#38A169',
  },
  betTypeAgainstSelected: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  betTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  betTypeTextSelected: {
    color: '#FFFFFF',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ED8936',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: '#ED8936',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
