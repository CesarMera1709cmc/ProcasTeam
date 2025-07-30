import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import BottomNavigation from '../components/BottomNavigation';
import { StoredUser, UserService } from '../services/UserService';

interface DailyChallengeScreenProps {
  navigation: any;
  route: any;
}

const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({ navigation, route }) => {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const userId = route?.params?.userId || 'user-cesar-1753750573601';

  // Reto diario memoizado
  const dailyChallenge = useMemo(() => ({
    id: 'daily-challenge-' + new Date().toDateString(),
    title: 'Organiza tu espacio de trabajo',
    description: 'Dedica 10 minutos a organizar y limpiar tu área de trabajo. Un espacio ordenado mejora la productividad.',
    points: 15,
    icon: 'home',
    tips: [
      '🗂️ Organiza documentos y archivos',
      '🧹 Limpia tu escritorio',
      '💻 Organiza cables y dispositivos',
      '🗑️ Desecha lo que no necesitas'
    ]
  }), []);

  // Estadísticas memoizadas
  const weeklyProgress = useMemo(() => {
    const completed = challengeCompleted ? 1 : 0;
    return {
      completed,
      total: 7,
      percentage: (completed / 7) * 100
    };
  }, [challengeCompleted]);

  // Callbacks optimizados
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await UserService.getUser(userId);
      setCurrentUser(user);
      
      // Por ahora, verificar si ya completó el reto basado en el día actual
      // TODO: Implementar sistema de retos diarios en la base de datos
      const today = new Date().toDateString();
      const lastChallengeDate = localStorage?.getItem(`challenge_${userId}_${today}`);
      setChallengeCompleted(!!lastChallengeDate);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleCompleteChallenge = useCallback(async () => {
    if (challengeCompleted) return;

    Alert.alert(
      '¡Reto Completado! 🎉',
      `¡Excelente trabajo! Has ganado ${dailyChallenge.points} puntos extra.`,
      [
        {
          text: 'Genial!',
          onPress: async () => {
            try {
              if (currentUser) {
                // Actualizar puntos del usuario
                const updatedUser = {
                  ...currentUser,
                  points: currentUser.points + dailyChallenge.points,
                  lastActive: new Date().toISOString(),
                };
                
                await UserService.updateUser(userId, updatedUser);
                setCurrentUser(updatedUser);
                setChallengeCompleted(true);
                
                // Guardar que completó el reto hoy
                const today = new Date().toDateString();
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(`challenge_${userId}_${today}`, 'completed');
                }
              }
            } catch (error) {
              console.error('Error updating challenge:', error);
              Alert.alert('Error', 'No se pudo actualizar el reto. Inténtalo de nuevo.');
            }
          }
        }
      ]
    );
  }, [challengeCompleted, dailyChallenge.points, currentUser, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Componente memoizado para tips
  const TipItem = React.memo(({ tip, index }: { tip: string; index: number }) => (
    <View style={styles.tipItem}>
      <Text style={styles.tipNumber}>{index + 1}</Text>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  ));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando reto diario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reto Diario</Text>
          <Text style={styles.headerSubtitle}>
            {weeklyProgress.completed}/7 completados esta semana
          </Text>
        </View>

        {/* Challenge Card */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Feather name={dailyChallenge.icon as any} size={32} color="#4299E1" />
            <Text style={styles.challengeTitle}>{dailyChallenge.title}</Text>
          </View>
          
          <Text style={styles.challengeDescription}>
            {dailyChallenge.description}
          </Text>

          <View style={styles.challengeReward}>
            <Feather name="star" size={16} color="#D69E2E" />
            <Text style={styles.rewardText}>+{dailyChallenge.points} puntos</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              challengeCompleted && styles.completeButtonCompleted
            ]}
            onPress={handleCompleteChallenge}
            disabled={challengeCompleted}
            activeOpacity={0.7}
          >
            <Text style={styles.completeButtonText}>
              {challengeCompleted ? '✅ Completado' : '🎯 Marcar como Completado'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Consejos para completarlo:</Text>
          <View style={styles.tipsList}>
            {dailyChallenge.tips.map((tip, index) => (
              <TipItem key={index} tip={tip} index={index} />
            ))}
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progreso Semanal</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${weeklyProgress.percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {weeklyProgress.completed} de {weeklyProgress.total} retos completados
          </Text>
        </View>
      </ScrollView>

      <BottomNavigation 
        navigation={navigation} 
        currentScreen="DailyChallenge"
        userId={userId}
        userName={currentUser?.name}
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4A5568',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
    flex: 1,
  },
  challengeDescription: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
    marginBottom: 16,
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  rewardText: {
    fontSize: 14,
    color: '#38A169',
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#2D3748',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonCompleted: {
    backgroundColor: '#38A169',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
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
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipNumber: {
    fontSize: 14,
    color: '#38A169',
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    flex: 1,
  },
  progressCard: {
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
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38A169',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
  },
});

export default React.memo(DailyChallengeScreen);