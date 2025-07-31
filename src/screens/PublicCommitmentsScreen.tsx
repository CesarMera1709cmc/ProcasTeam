import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalService } from '../services/GoalService';
import { StoredUser, UserService } from '../services/UserService';
import { RootStackParamList } from '../types/types';
import { BettingModal } from '../components/BettingModal';

const PublicCommitmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [publicGoals, setPublicGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBetModalVisible, setIsBetModalVisible] = useState(false);
  const [selectedGoalToBet, setSelectedGoalToBet] = useState<Goal | null>(null);

  // Obtener userId desde AsyncStorage
  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('currentUserId');
      return storedUserId || 'user-cesar-1753750573601';
    } catch (error) {
      console.error('Error getting userId:', error);
      return 'user-cesar-1753750573601';
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userId = await getUserId();

      const [user, users, allGoals] = await Promise.all([
        UserService.getUser(userId),
        UserService.getAllUsers(),
        GoalService.getPublicGoals()
      ]);

      setCurrentUser(user);
      setAllUsers(users);
      setPublicGoals(allGoals);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();

      // Escuchar cambios en tiempo real
      const unsubscribeUsers = UserService.listenToUsers(setAllUsers);
      const unsubscribeGoals = GoalService.listenToPublicGoals(setPublicGoals);

      return () => {
        unsubscribeUsers();
        unsubscribeGoals();
      };
    }, [])
  );

  const myCurrentCommitment = publicGoals.find(
    goal => goal.userId === currentUser?.id && !goal.isCompleted && !goal.isIncomplete
  );
  
  const otherUsersCommitments = publicGoals.filter(
    goal => goal.userId !== currentUser?.id && !goal.isCompleted && !goal.isIncomplete
  );

  const myPastCommitments = publicGoals.filter(
    goal => goal.userId === currentUser?.id && (goal.isCompleted || goal.isIncomplete)
  );

  const handleSelectImage = async () => {
    try {
      // Solicitar permisos para acceder a la cámara.
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permiso denegado",
          "Necesitas conceder permisos a la cámara para tomar una foto."
        );
        return;
      }

      // Abrir la cámara del dispositivo.
      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Calidad reducida para pruebas
      });

      // Si el usuario no cancela la cámara (es decir, si toma una foto).
      if (!cameraResult.canceled) {
        // En lugar de procesar la imagen, mostramos una alerta.
        // Esto evita que la imagen se seleccione y que el botón de "subir" se active.
        Alert.alert(
          "Función no disponible",
          "La subida de evidencia fotográfica está en desarrollo. ¡Pronto estará lista!"
        );
        // No hacemos nada con cameraResult.assets[0] para evitar errores.
      }
    } catch (error) {
      console.error("Error al abrir la cámara:", error);
      Alert.alert("Error", "Ocurrió un problema al intentar abrir la cámara.");
    }
  };

  const handleUploadEvidence = async () => {
    if (myCurrentCommitment) {
      Alert.alert(
        '¡Completar Meta!',
        `¿Completaste "${myCurrentCommitment.title}" exitosamente?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Sí, completado',
            onPress: async () => {
              try {
                // Si hay imagen seleccionada, usar una URL de ejemplo
                // Si no hay imagen, pasar null o una cadena vacía
                const evidenceUrl = selectedImage ? 'https://example.com/evidence.jpg' : '';

                // Marcar meta como completada en Firebase
                await GoalService.completePublicGoal(myCurrentCommitment.id, evidenceUrl);
                
                // Mostrar éxito y recargar datos
                Alert.alert(
                  '¡Excelente! 🏆',
                  `¡Completaste "${myCurrentCommitment.title}"!\n\nHas ganado +${myCurrentCommitment.points} puntos (y un bonus por ser público) 🎯`,
                  [{ 
                    text: 'Genial!', 
                    onPress: () => {
                      setSelectedImage(null);
                      loadData(); // Recargar datos
                    }
                  }]
                );

              } catch (error) {
                console.error('Error completing goal:', error);
                Alert.alert('Error', 'No se pudo completar la meta. Inténtalo de nuevo.');
              }
            }
          }
        ]
      );
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserForGoal = (userId: string) => {
    return allUsers.find(u => u.id === userId);
  };

  const handleBetPlaced = () => {
    // Recargar los datos para reflejar el cambio en los puntos del usuario y las apuestas de la meta
    loadData();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando compromisos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Error al cargar usuario</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compromisos Públicos</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userPoints}>{currentUser?.points || 0} pts</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {myCurrentCommitment ? (
          <>
            {/* Current Commitment */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tu Compromiso Actual</Text>
              <View style={styles.commitmentBox}>
                <Text style={styles.commitmentText}>
                  📝 "{myCurrentCommitment.title}"
                </Text>
                <Text style={styles.commitmentDescription}>
                  {myCurrentCommitment.description}
                </Text>
                <Text style={styles.commitmentDate}>
                  Fecha límite: {formatDate(myCurrentCommitment.dueDate)}
                </Text>
                <Text style={styles.commitmentPoints}>
                  Puntos en juego: +{myCurrentCommitment.points} pts (+Bonus)
                </Text>
              </View>
              
              {/* Other Users */}
              {allUsers.filter(u => u.id !== currentUser?.id).length > 0 && (
                <View style={styles.teamSection}>
                  <Text style={styles.sectionTitle}>Tu Equipo te está observando 👀</Text>
                  {allUsers.filter(u => u.id !== currentUser?.id).slice(0, 2).map(user => (
                    <View key={user.id} style={styles.teammateBox}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.avatarText}>{user.name[0]}</Text>
                      </View>
                      <View style={styles.teammateInfo}>
                        <Text style={styles.teammateName}>{user.name}</Text>
                        <Text style={styles.teammateMessage}>
                          ¡Está esperando que cumplas tu compromiso! 💪
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Evidence Upload */}
              <View style={styles.evidenceSection}>
                <Text style={styles.sectionTitle}>Subir Evidencia (Opcional)</Text>
                <View style={styles.uploadBox}>
                  <Feather name="camera" size={32} color="#A0AEC0" />
                  <Text style={styles.uploadText}>
                    {selectedImage ? 'Imagen seleccionada ✅' : 'Toma una foto como evidencia (opcional)'}
                  </Text>
                  {selectedImage && (
                    <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                  )}
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={handleSelectImage}
                    activeOpacity={0.7}
                  >
                    <Feather name="camera" size={16} color="#4A5568" />
                    <Text style={styles.selectButtonText}>
                      {selectedImage ? 'Cambiar Foto' : 'Seleccionar Foto'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleUploadEvidence}
                  activeOpacity={0.8}
                >
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Marcar como Completado</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sin Compromisos Actuales</Text>
            <Text style={styles.emptyMessage}>
              No tienes compromisos públicos activos.{'\n\n'}
              Crea una meta pública desde el Dashboard para comenzar a construir responsabilidad con tu equipo.
            </Text>
            <TouchableOpacity
              style={styles.createGoalButton}
              onPress={async () => {
                const userId = await getUserId();
                navigation.navigate('CreateGoal', { userId, userName: currentUser?.name || '' });
              }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.createGoalButtonText}>Crear Meta Pública</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Other Users' Commitments */}
        {otherUsersCommitments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compromisos de tu Equipo</Text>
            {otherUsersCommitments.map(goal => {
              const user = getUserForGoal(goal.userId);
              if (!user) return null;

              return (
                <View key={goal.id} style={styles.otherCommitmentCard}>
                  <View style={styles.otherCommitmentCard}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>{user.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.teammateName}>{user.name}</Text>
                      <Text style={styles.commitmentDate}>
                        Límite: {formatDate(goal.dueDate)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commitmentText}>"{goal.title}"</Text>
                  <Text style={styles.commitmentPoints}>
                    Recompensa: {goal.points} pts
                  </Text>
                  <TouchableOpacity 
                    style={styles.betButton}
                    onPress={() => {
                      setSelectedGoalToBet(goal);
                      setIsBetModalVisible(true);
                    }}
                  >
                    <Feather name="target" size={16} color="#FFFFFF" />
                    <Text style={styles.betButtonText}>Apostar Puntos</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Results */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historial de Compromisos</Text>
          <View style={styles.resultsList}>
            {myPastCommitments.slice(0, 5).map(goal => (
              <View key={goal.id} style={[
                styles.resultItem,
                goal.isCompleted ? styles.completedResult : styles.incompleteResult
              ]}>
                <Feather 
                  name={goal.isCompleted ? "check" : "x"} 
                  size={16} 
                  color={goal.isCompleted ? "#38A169" : "#E53E3E"} 
                />
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>
                    {goal.isCompleted ? '¡Completado!' : 'No completado'}
                  </Text>
                  <Text style={styles.resultDescription}>{goal.title}</Text>
                  <Text style={styles.resultDate}>
                    {formatDate(goal.completedAt || goal.incompleteAt || goal.dueDate)}
                  </Text>
                </View>
                <Text style={[
                  styles.resultPoints,
                  { color: goal.isCompleted ? '#38A169' : '#E53E3E' }
                ]}>
                  {goal.isCompleted ? '+' : '-'}{goal.points} pts
                </Text>
              </View>
            ))}
            {myPastCommitments.length === 0 && (
              <Text style={styles.emptyMessage}>No hay historial de compromisos aún</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <BettingModal
        visible={isBetModalVisible}
        onClose={() => setIsBetModalVisible(false)}
        onBetPlaced={handleBetPlaced}
        goal={selectedGoalToBet}
        currentUser={currentUser}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 16,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  userPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38A169',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  commitmentBox: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  commitmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 8,
  },
  commitmentDescription: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  commitmentDate: {
    fontSize: 14,
    color: '#718096',
  },
  commitmentPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38A169',
    marginTop: 4,
  },
  otherCommitmentCard: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    gap: 12,
  },
  betButton: {
    backgroundColor: '#ED8936',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  betButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  teamSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  teammateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38A169',
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#38A169',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teammateInfo: {
    flex: 1,
  },
  teammateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  teammateMessage: {
    fontSize: 12,
    color: '#38A169',
  },
  evidenceSection: {
    gap: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F7FAFC',
  },
  uploadText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  selectButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#38A169',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createGoalButton: {
    backgroundColor: '#4299E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  createGoalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsList: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
  },
  completedResult: {
    backgroundColor: '#F0FFF4',
    borderLeftColor: '#38A169',
  },
  incompleteResult: {
    backgroundColor: '#FED7D7',
    borderLeftColor: '#E53E3E',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: 14,
    color: '#718096',
  },
  resultDate: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
  resultPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38A169',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#718096',
    paddingVertical: 20,
    fontSize: 16,
  },
});

export default PublicCommitmentsScreen;