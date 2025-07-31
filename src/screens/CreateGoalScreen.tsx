import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/types';
import { GoalService, Goal } from '../services/GoalService';
import { UserService } from '../services/UserService';

type CreateGoalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGoal'>;
type CreateGoalScreenRouteProp = RouteProp<RootStackParamList, 'CreateGoal'>;

interface CreateGoalScreenProps {
  navigation: CreateGoalScreenNavigationProp;
  route: CreateGoalScreenRouteProp;
}

const CreateGoalScreen: React.FC<CreateGoalScreenProps> = ({ route, navigation }) => {
  const { userId, userName } = route.params;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date(),
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    frequency: 'once' as 'once' | 'daily' | 'weekly',
    isPublic: false, // Se determinará después de la verificación
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasActivePublicGoal, setHasActivePublicGoal] = useState(true); // Asumir que tiene para deshabilitar al inicio
  const [isCheckingGoal, setIsCheckingGoal] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const checkActivePublicGoal = async () => {
        setIsCheckingGoal(true);
        try {
          const userGoals = await GoalService.getUserGoals(userId);
          const activeGoal = userGoals.find(
            g => g.isPublic && !g.isCompleted && !g.isIncomplete
          );
          if (activeGoal) {
            setHasActivePublicGoal(true);
            setFormData(prev => ({ ...prev, isPublic: false }));
          } else {
            setHasActivePublicGoal(false);
            setFormData(prev => ({ ...prev, isPublic: true }));
          }
        } catch (error) {
          console.error("Error checking for active public goal:", error);
          setHasActivePublicGoal(false); // Permitir crear si hay error
        } finally {
          setIsCheckingGoal(false);
        }
      };

      checkActivePublicGoal();
    }, [userId])
  );

  const handleCreateGoal = async () => {
    const { title, description, dueDate, frequency, difficulty, isPublic } = formData;

    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la meta');
      return;
    }

    // Validar que la fecha no sea en el pasado
    const now = new Date();
    if (dueDate < now) {
      Alert.alert('Error', 'La fecha límite no puede ser en el pasado.');
      return;
    }

    setIsLoading(true);

    try {
      // Obtener el usuario actual para asegurar que usamos el Firebase key correcto
      const currentUser = await UserService.getUser(userId);
      if (!currentUser) {
        throw new Error('Usuario no encontrado');
      }

      // Usar el Firebase key del usuario si está disponible, sino el ID original
      const realUserId = currentUser.firebaseKey || currentUser.id;

      const points = difficulty === 'easy' ? 2 : 
                    difficulty === 'medium' ? 5 : 10;

      const goalData: Goal = {
        id: `goal-${realUserId}-${Date.now()}`,
        userId: realUserId, // Usar el Firebase key real
        title: title.trim(),
        description: description.trim(),
        difficulty,
        points,
        dueDate: dueDate.toISOString(),
        frequency,
        isPublic,
        isCompleted: false,
        isIncomplete: false,
        createdAt: new Date().toISOString(),
      };

      // Guardar la meta en Firebase
      await GoalService.createGoal(goalData);

      console.log('✅ Meta creada exitosamente:', goalData.title);
      console.log('👤 Usuario ID usado:', realUserId);

      Alert.alert(
        '¡Meta creada! 🎯', 
        `Tu meta "${title}" ha sido creada exitosamente.\n\n` +
        `Puntos por completar: +${points}\n` +
        `${isPublic ? 'Visible para tus amigos' : 'Solo visible para ti'}`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error creating goal:', error);
      Alert.alert(
        'Error', 
        'Hubo un problema al crear tu meta. Inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, dueDate: selectedDate });
    }
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(formData.dueDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setFormData({ ...formData, dueDate: newDate });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyStyle = (difficulty: 'easy' | 'medium' | 'hard') => {
    const isSelected = formData.difficulty === difficulty;
    if (isSelected) {
      return difficulty === 'easy' ? styles.easySelected :
             difficulty === 'medium' ? styles.mediumSelected :
             styles.hardSelected;
    }
    return styles.difficultyUnselected;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Feather name="arrow-left" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Meta</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Goal Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la meta *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Ej: Terminar ensayo de historia"
              placeholderTextColor="#A0AEC0"
              maxLength={100}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{formData.title.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Detalles adicionales..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{formData.description.length}/500</Text>
          </View>

          {/* Date and Time */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fecha límite *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Feather name="calendar" size={16} color="#718096" />
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.dueDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Hora límite *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Feather name="clock" size={16} color="#718096" />
                <Text style={styles.dateButtonText}>
                  {formatTime(formData.dueDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nivel de dificultad</Text>
            <Text style={styles.helpText}>Más dificultad = más puntos al completar</Text>
            <View style={styles.difficultyRow}>
              <TouchableOpacity
                style={[styles.difficultyButton, getDifficultyStyle('easy')]}
                onPress={() => setFormData({ ...formData, difficulty: 'easy' })}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.difficultyEmoji}>😊</Text>
                <Text style={[
                  styles.difficultyText,
                  formData.difficulty === 'easy' && styles.difficultyTextSelected
                ]}>
                  Fácil
                </Text>
                <Text style={[
                  styles.difficultyPoints,
                  formData.difficulty === 'easy' && styles.difficultyTextSelected
                ]}>
                  +2 pts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.difficultyButton, getDifficultyStyle('medium')]}
                onPress={() => setFormData({ ...formData, difficulty: 'medium' })}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.difficultyEmoji}>😤</Text>
                <Text style={[
                  styles.difficultyText,
                  formData.difficulty === 'medium' && styles.difficultyTextSelected
                ]}>
                  Medio
                </Text>
                <Text style={[
                  styles.difficultyPoints,
                  formData.difficulty === 'medium' && styles.difficultyTextSelected
                ]}>
                  +5 pts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.difficultyButton, getDifficultyStyle('hard')]}
                onPress={() => setFormData({ ...formData, difficulty: 'hard' })}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.difficultyEmoji}>🔥</Text>
                <Text style={[
                  styles.difficultyText,
                  formData.difficulty === 'hard' && styles.difficultyTextSelected
                ]}>
                  Difícil
                </Text>
                <Text style={[
                  styles.difficultyPoints,
                  formData.difficulty === 'hard' && styles.difficultyTextSelected
                ]}>
                  +10 pts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Frequency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frecuencia</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  formData.frequency === 'once' && styles.pickerButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, frequency: 'once' })}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={[
                  styles.pickerText,
                  formData.frequency === 'once' && styles.pickerTextSelected
                ]}>
                  Una vez
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  formData.frequency === 'daily' && styles.pickerButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, frequency: 'daily' })}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={[
                  styles.pickerText,
                  formData.frequency === 'daily' && styles.pickerTextSelected
                ]}>
                  Diaria
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  formData.frequency === 'weekly' && styles.pickerButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, frequency: 'weekly' })}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={[
                  styles.pickerText,
                  formData.frequency === 'weekly' && styles.pickerTextSelected
                ]}>
                  Semanal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Public Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Compartir con amigos</Text>
              <Text style={styles.helpText}>
                {isCheckingGoal
                  ? 'Verificando compromisos...'
                  : hasActivePublicGoal
                  ? 'Ya tienes un compromiso público activo.'
                  : formData.isPublic 
                  ? 'Tus amigos pueden ver tu progreso y apostar' 
                  : 'Solo tú puedes ver esta meta'}
              </Text>
            </View>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => setFormData({ ...formData, isPublic: value })}
              trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
              thumbColor={formData.isPublic ? '#FFFFFF' : '#FFFFFF'}
              disabled={isLoading || hasActivePublicGoal || isCheckingGoal}
            />
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateGoal}
          activeOpacity={0.8}
          disabled={isLoading || !formData.title.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Feather name="plus" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creando...' : 'Crear Meta'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dueDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={formData.dueDate}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2D3748',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  difficultyUnselected: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  easySelected: {
    borderColor: '#38A169',
    backgroundColor: '#F0FFF4',
  },
  mediumSelected: {
    borderColor: '#F6AD55',
    backgroundColor: '#FFFBEB',
  },
  hardSelected: {
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  difficultyEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  difficultyPoints: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  difficultyTextSelected: {
    color: '#2D3748',
  },
  pickerContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickerButtonSelected: {
    backgroundColor: '#2D3748',
  },
  pickerText: {
    fontSize: 14,
    color: '#718096',
  },
  pickerTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  createButton: {
    backgroundColor: '#2D3748',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateGoalScreen;