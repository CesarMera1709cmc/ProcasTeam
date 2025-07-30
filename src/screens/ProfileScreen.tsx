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
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalService } from '../services/GoalService';
import { StoredUser, UserService } from '../services/UserService';
import { RootStackParamList } from '../types/types';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener userId desde AsyncStorage
  const getUserId = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('currentUserId');
      return storedUserId || 'user-cesar-1753750573601';
    } catch (error) {
      console.error('Error getting userId:', error);
      return 'user-cesar-1753750573601';
    }
  }, []);

  // Estadísticas memoizadas
  const userStats = useMemo(() => {
    const completedGoals = goals.filter(goal => goal.isCompleted);
    const totalGoals = goals.length;
    const successRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
    const level = Math.floor((currentUser?.points || 0) / 100) + 1;
    const pointsToNextLevel = 100 - ((currentUser?.points || 0) % 100);

    return {
      completedGoals: completedGoals.length,
      totalGoals,
      successRate: Math.round(successRate),
      level,
      pointsToNextLevel,
      levelProgress: ((currentUser?.points || 0) % 100)
    };
  }, [goals, currentUser?.points]);

  // Ranking memoizado
  const userRanking = useMemo(() => {
    const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);
    const userPosition = sortedUsers.findIndex(user => user.id === (currentUser?.id || '')) + 1;
    return {
      position: userPosition,
      total: allUsers.length
    };
  }, [allUsers, currentUser?.id]);

  // Logros básicos - sin servicios adicionales
  const achievements = useMemo(() => [
    {
      id: 'first-goal',
      title: 'Primera Meta',
      description: 'Completaste tu primera meta',
      icon: 'target',
      unlocked: userStats.completedGoals >= 1,
      color: '#38A169'
    },
    {
      id: 'goal-master',
      title: 'Maestro de Metas',
      description: 'Completaste 5 metas',
      icon: 'award',
      unlocked: userStats.completedGoals >= 5,
      color: '#D69E2E'
    },
    {
      id: 'streak-warrior',
      title: 'Guerrero de Rachas',
      description: 'Mantuviste una racha de 7 días',
      icon: 'zap',
      unlocked: (currentUser?.streak || 0) >= 7,
      color: '#9F7AEA'
    },
    {
      id: 'social-butterfly',
      title: 'Mariposa Social',
      description: 'Completa 3 compromisos públicos',
      icon: 'users',
      unlocked: goals.filter(g => g.isPublic && g.isCompleted).length >= 3,
      color: '#E53E3E'
    }
  ], [userStats, currentUser?.streak, goals]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = await getUserId();
      
      const [user, userGoals, users] = await Promise.all([
        UserService.getUser(userId),
        GoalService.getUserGoals(userId),
        UserService.getAllUsers()
      ]);
      
      setCurrentUser(user);
      setGoals(userGoals);
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  const handleCreateGoal = useCallback(async () => {
    const userId = await getUserId();
    navigation.navigate('CreateGoal', { userId, userName: currentUser?.name || '' });
  }, [navigation, currentUser?.name, getUserId]);

  const handleViewTeam = useCallback(async () => {
    const userId = await getUserId();
    navigation.navigate('Team', { currentUserId: userId });
  }, [navigation, getUserId]);

  useEffect(() => {
    loadData();

    // Escuchar cambios en tiempo real
    const unsubscribeUsers = UserService.listenToUsers((users) => {
      setAllUsers(users);
      getUserId().then(userId => {
        const user = users.find(u => u.id === userId);
        if (user) setCurrentUser(user);
      });
    });

    const unsubscribeGoals = GoalService.listenToGoals((allGoals) => {
      getUserId().then(userId => {
        const userGoals = allGoals.filter(goal => goal.userId === userId);
        setGoals(userGoals);
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGoals();
    };
  }, [loadData, getUserId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{currentUser?.name}</Text>
          <Text style={styles.userLevel}>Nivel {userStats.level}</Text>
          
          {/* Level Progress */}
          <View style={styles.levelProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${userStats.levelProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {userStats.pointsToNextLevel} puntos para el siguiente nivel
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentUser?.points || 0}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.completedGoals}</Text>
            <Text style={styles.statLabel}>Metas Completadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.successRate}%</Text>
            <Text style={styles.statLabel}>Tasa de Éxito</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>#{userRanking.position}</Text>
            <Text style={styles.statLabel}>Ranking</Text>
          </View>
        </View>

        {/* Achievements - solo los básicos */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>
            🏆 Logros ({achievements.filter(a => a.unlocked).length}/{achievements.length})
          </Text>
          <View style={styles.achievementsList}>
            {achievements.map(achievement => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked
                ]}
              >
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: achievement.unlocked ? achievement.color : '#A0AEC0' }
                ]}>
                  <Feather 
                    name={achievement.icon} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    { color: achievement.unlocked ? '#2D3748' : '#A0AEC0' }
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <Feather name="check" size={16} color="#38A169" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateGoal}>
            <Feather name="plus" size={20} color="#4299E1" />
            <Text style={styles.actionButtonText}>Crear Nueva Meta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleViewTeam}>
            <Feather name="users" size={20} color="#38A169" />
            <Text style={styles.actionButtonText}>Ver Equipo</Text>
          </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#2D3748',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  levelProgress: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2D3748',
    borderRadius: 8,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38A169',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  achievementUnlocked: {
    borderColor: '#38A169',
  },
  achievementLocked: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementInfo: {
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  rarityText: {
    fontSize: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
});

export default React.memo(ProfileScreen);