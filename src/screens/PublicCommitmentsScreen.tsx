import React, { useState } from 'react';
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
import { Goal } from '../services/GoalService';
import { StoredUser } from '../services/UserService';

interface PublicCommitmentsScreenProps {
  navigation: any;
  currentUser: StoredUser;
  goals: Goal[];
  allUsers: StoredUser[];
  onUploadEvidence: (goalId: string, image: any) => void;
}

const PublicCommitmentsScreen: React.FC<PublicCommitmentsScreenProps> = ({
  navigation,
  currentUser,
  goals,
  allUsers,
  onUploadEvidence,
}) => {
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const publicGoals = goals.filter(goal => goal.isPublic);
  const currentCommitment = publicGoals.find(goal => !goal.isCompleted);
  const otherUser = allUsers.find(user => user.id !== currentUser.id);

  const handleSelectImage = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se necesitan permisos para acceder a la galería.');
        return;
      }

      // Abrir galería
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleUploadEvidence = () => {
    if (currentCommitment && selectedImage) {
      Alert.alert(
        '¡Evidencia subida!',
        'Tu evidencia ha sido registrada exitosamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              onUploadEvidence(currentCommitment.id, selectedImage);
              setSelectedImage(null);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compromisos Públicos</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentCommitment ? (
          <>
            {/* Current Commitment */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tu Compromiso Actual</Text>
              <View style={styles.commitmentBox}>
                <Text style={styles.commitmentText}>
                  📝 "{currentCommitment.title}"
                </Text>
                <Text style={styles.commitmentDate}>
                  Fecha límite: {currentCommitment.dueDate ? formatDate(currentCommitment.dueDate) : 'Sin fecha límite'}
                </Text>
              </View>
              
              {/* Other User Bet */}
              {otherUser && (
                <View style={styles.betBox}>
                  <View style={styles.betHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>{otherUser.name[0]}</Text>
                    </View>
                    <View style={styles.betInfo}>
                      <Text style={styles.betterName}>{otherUser.name} apostó 10 puntos</Text>
                      <Text style={styles.betDescription}>a que NO lo lograrás</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Evidence Upload */}
              <View style={styles.evidenceSection}>
                <Text style={styles.sectionTitle}>Subir Evidencia</Text>
                <View style={styles.uploadBox}>
                  <Feather name="camera" size={32} color="#A0AEC0" />
                  <Text style={styles.uploadText}>
                    {selectedImage ? 'Imagen seleccionada' : 'Selecciona una foto de evidencia'}
                  </Text>
                  {selectedImage && (
                    <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                  )}
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={handleSelectImage}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectButtonText}>Seleccionar Archivo</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    (!selectedImage) && styles.uploadButtonDisabled
                  ]}
                  onPress={handleUploadEvidence}
                  disabled={!selectedImage}
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
              No tienes compromisos públicos activos. Crea una meta pública para comenzar.
            </Text>
          </View>
        )}

        {/* Results */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resultados Recientes</Text>
          <View style={styles.resultsList}>
            {publicGoals.filter(goal => goal.isCompleted).slice(0, 3).map(goal => (
              <View key={goal.id} style={styles.resultItem}>
                <Feather name="check" size={16} color="#38A169" />
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>¡Ganaste!</Text>
                  <Text style={styles.resultDescription}>{goal.title}</Text>
                </View>
                <Text style={styles.resultPoints}>+{goal.points} pts</Text>
              </View>
            ))}
            {publicGoals.filter(goal => goal.isCompleted).length === 0 && (
              <Text style={styles.emptyMessage}>No hay resultados recientes</Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  commitmentDate: {
    fontSize: 14,
    color: '#718096',
  },
  betBox: {
    backgroundColor: '#FED7D7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
  },
  betHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#E53E3E',
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
  betInfo: {
    flex: 1,
  },
  betterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C53030',
    marginBottom: 2,
  },
  betDescription: {
    fontSize: 14,
    color: '#E53E3E',
  },
  evidenceSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
  resultsList: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#38A169',
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