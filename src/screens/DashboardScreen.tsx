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
import { Goal, GoalService } from '../services/GoalService';
import { StoredUser, UserService } from '../services/UserService';

interface DashboardScreenProps {
  navigation: any;
  route: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { userId, userName } = route.params;

  // Memoizar datos calculados
  const memoizedGoals = useMemo(() => goals, [goals]);
  
  const completedGoals = useMemo(() => 
    goals.filter(goal => goal.isCompleted), 
    [goals]
  );

  const activeGoals = useMemo(() => 
    goals.filter(goal => !goal.isCompleted && !goal.isIncomplete), 
    [goals]
  );

  // Callbacks optimizados para navegación
  const handleCreateGoal = useCallback(() => {
    navigation.navigate('CreateGoal', { userId, userName });
  }, [navigation, userId, userName]);

  const handleTeamNavigation = useCallback(() => {
    navigation.navigate('Team', { currentUserId: userId });
  }, [navigation, userId]);

  const handlePublicCommitments = useCallback(() => {
    navigation.replace('PublicCommitments', { userId, userName });
  }, [navigation, userId, userName]);

  // Callback optimizado para completar metas
  const handleCompleteGoal = useCallback(async (goalId: string) => {
    try {
      await GoalService.completeGoal(goalId);
      // Actualizar solo el estado local sin recargar todo
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, isCompleted: true, completedAt: new Date().toISOString() }
          : goal
      ));
      Alert.alert('¡Excelente!', '¡Meta completada!');
    } catch (error) {
      console.error('Error completing goal:', error);
      Alert.alert('Error', 'No se pudo completar la meta');
    }
  }, []);

  const handleTogglePublic = useCallback(async (goalId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        const updatedGoal = { ...goal, isPublic: !goal.isPublic };
        await GoalService.updateGoal(goalId, updatedGoal);
        setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      }
    } catch (error) {
      console.error('Error toggling public:', error);
    }
  }, [goals]);

  // Cargar datos solo una vez
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
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
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Componente memoizado para las cards de metas
  const GoalCard = React.memo(({ goal, onComplete, onTogglePublic }: any) => (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.goalMeta}>
          <Text style={styles.goalPoints}>+{goal.points} pts</Text>
        </View>
      </View>
      <Text style={styles.goalDescription}>{goal.description}</Text>
      
      <View style={styles.goalFooter}>
        <View style={styles.goalActions}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => onComplete(goal.id)}
            activeOpacity={0.7}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Completar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.publicButton, goal.isPublic && styles.publicButtonActive]}
            onPress={() => onTogglePublic(goal.id)}
            activeOpacity={0.7}
          >
            <Feather 
              name={goal.isPublic ? "eye" : "eye-off"} 
              size={14} 
              color={goal.isPublic ? "#FFFFFF" : "#4299E1"} 
            />
            <Text style={[
              styles.publicButtonText,
              { color: goal.isPublic ? "#FFFFFF" : "#4299E1" }
            ]}>
              {goal.isPublic ? 'Público' : 'Privado'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>¡Hola, {userName}! 👋</Text>
            <Text style={styles.subgreeting}>¿Listo para ser productivo?</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.teamButton, { backgroundColor: '#FFF5F5', marginRight: 8 }]}
              onPress={handlePublicCommitments}
            >
              <Feather name="target" size={16} color="#E53E3E" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.teamButton}
              onPress={handleTeamNavigation}
            >
              <Feather name="users" size={20} color="#4299E1" />
            </TouchableOpacity>
            <View style={styles.pointsContainer}>
              <Text style={styles.points}>{currentUser?.points || 0}</Text>
              <Text style={styles.pointsLabel}>puntos</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#E6FFFA' }]}>
            <Feather name="target" size={24} color="#319795" />
            <Text style={styles.statNumber}>{activeGoals.length}</Text>
            <Text style={styles.statLabel}>Metas Activas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FFF4' }]}>
            <Feather name="check-circle" size={24} color="#38A169" />
            <Text style={styles.statNumber}>{completedGoals.length}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <Feather name="zap" size={24} color="#D69E2E" />
            <Text style={styles.statNumber}>{currentUser?.streak || 0}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsSectionHeader}>
            <Text style={styles.sectionTitle}>Tus Metas 🎯</Text>
            <TouchableOpacity
              onPress={handleCreateGoal}
              style={styles.addButton}
            >
              <Feather name="plus" size={16} color="#4299E1" />
            </TouchableOpacity>
          </View>

          {/* Goals List */}
          <View style={styles.goalsCarouselContainer}>
            {memoizedGoals.length > 0 ? (
              memoizedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onComplete={handleCompleteGoal}
                  onTogglePublic={handleTogglePublic}
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateEmoji}>🎯</Text>
                <Text style={styles.emptyStateTitle}>¡Crea tu primera meta!</Text>
                <TouchableOpacity
                  style={styles.createFirstGoalButton}
                  onPress={handleCreateGoal}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.createFirstGoalText}>Crear Meta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateGoal}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <BottomNavigation 
        navigation={navigation} 
        currentScreen="Dashboard"
        userId={userId}
        userName={userName}
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  subgreeting: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamButton: {
    padding: 8,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#38A169',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#718096',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '500',
  },
  totalPoints: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 12,
  },
  goalMeta: {
    alignItems: 'flex-end',
  },
  goalPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38A169',
  },
  goalDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 16,
  },
  goalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    paddingTop: 16,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#38A169',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  publicButton: {
    backgroundColor: '#EBF8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4299E1',
    gap: 6,
  },
  publicButtonActive: {
    backgroundColor: '#4299E1',
    borderColor: '#4299E1',
  },
  publicButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Estilos del carrusel
  goalsCarouselContainer: {
    marginBottom: 24,
  },
  carouselHeader: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  carouselSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  goalsCarousel: {
    marginHorizontal: -16,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  goalCategoryCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 16,
  },
  categoryHeader: {
    padding: 16,
    paddingBottom: 12,
    borderTopWidth: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  categorySubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryGoalsList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyCategory: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
  },
  categoryStats: {
    alignItems: 'center',
  },
  statLabelSmall: {
    fontSize: 11,
    color: '#A0AEC0',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Estilos del ranking
  rankingList: {
    gap: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  firstPlace: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F6AD55',
  },
  currentUser: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#4299E1',
  },
  regularUser: {
    backgroundColor: '#F7FAFC',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankingInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  userPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Estilos de notificaciones
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#2D3748',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#718096',
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#2D3748',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  goalsSection: {
    marginBottom: 24,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  addButton: {
    backgroundColor: '#4299E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstGoalButton: {
    backgroundColor: '#4299E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createFirstGoalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(DashboardScreen);