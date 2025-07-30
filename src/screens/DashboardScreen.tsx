import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/types';
import { UserService, StoredUser } from '../services/UserService';
import { GoalService, Goal } from '../services/GoalService';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
type DashboardScreenRouteProp = RouteProp<RootStackParamList, 'Dashboard'>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
  route: DashboardScreenRouteProp;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const { userId, userName } = route.params;
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos del usuario actual
      const user = await UserService.getUser(userId);
      setCurrentUser(user);

      // Cargar todos los usuarios
      const users = await UserService.getAllUsers();
      const sortedUsers = users.sort((a, b) => b.points - a.points);
      setAllUsers(sortedUsers);

      // Cargar metas del usuario
      const goals = await GoalService.getUserGoals(userId);
      setUserGoals(goals);
      console.log('📋 Metas del usuario cargadas:', goals.length);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎯 DashboardScreen iniciando para userId:', userId);
    loadUserData();

    // Escuchar cambios en usuarios
    const unsubscribeUsers = UserService.listenToUsers((users) => {
      const sortedUsers = users.sort((a, b) => b.points - a.points);
      setAllUsers(sortedUsers);
      
      // Actualizar usuario actual
      const updatedCurrentUser = users.find(u => u.id === userId);
      if (updatedCurrentUser) {
        setCurrentUser(updatedCurrentUser);
      }
    });

    // Escuchar cambios en metas
    const unsubscribeGoals = GoalService.listenToGoals((allGoals) => {
      const userGoalsFiltered = allGoals.filter(goal => goal.userId === userId);
      setUserGoals(userGoalsFiltered);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGoals();
    };
  }, [userId]);

  // Obtener fechas relevantes
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  // Categorizar metas por tiempo
  const categorizedGoals = userGoals.reduce((acc, goal) => {
    const goalDate = new Date(goal.dueDate);
    const goalDateOnly = new Date(goalDate.getFullYear(), goalDate.getMonth(), goalDate.getDate());
    
    if (goalDateOnly.getTime() === today.getTime()) {
      acc.today.push(goal);
    } else if (goalDateOnly.getTime() === tomorrow.getTime()) {
      acc.tomorrow.push(goal);
    } else if (goalDateOnly > tomorrow && goalDateOnly <= thisWeekEnd) {
      acc.thisWeek.push(goal);
    } else if (goalDateOnly > thisWeekEnd) {
      acc.later.push(goal);
    } else {
      acc.overdue.push(goal);
    }
    
    return acc;
  }, {
    today: [] as Goal[],
    tomorrow: [] as Goal[],
    thisWeek: [] as Goal[],
    later: [] as Goal[],
    overdue: [] as Goal[]
  });

  // Crear las categorías para mostrar
  const goalCategories = [
    {
      id: 'today',
      title: 'Tus metas de hoy',
      subtitle: categorizedGoals.today.length === 0 ? 'Sin metas para hoy' : 
                `${categorizedGoals.today.length} meta${categorizedGoals.today.length !== 1 ? 's' : ''}`,
      goals: categorizedGoals.today,
      color: '#4299E1',
      emoji: '📅'
    },
    {
      id: 'tomorrow',
      title: 'Metas de mañana',
      subtitle: categorizedGoals.tomorrow.length === 0 ? 'Sin metas para mañana' : 
                `${categorizedGoals.tomorrow.length} meta${categorizedGoals.tomorrow.length !== 1 ? 's' : ''}`,
      goals: categorizedGoals.tomorrow,
      color: '#38A169',
      emoji: '🌅'
    },
    {
      id: 'week',
      title: 'Esta semana',
      subtitle: categorizedGoals.thisWeek.length === 0 ? 'Sin metas esta semana' : 
                `${categorizedGoals.thisWeek.length} meta${categorizedGoals.thisWeek.length !== 1 ? 's' : ''}`,
      goals: categorizedGoals.thisWeek,
      color: '#F6AD55',
      emoji: '📊'
    },
    {
      id: 'later',
      title: 'Más adelante',
      subtitle: categorizedGoals.later.length === 0 ? 'Sin metas futuras' : 
                `${categorizedGoals.later.length} meta${categorizedGoals.later.length !== 1 ? 's' : ''}`,
      goals: categorizedGoals.later,
      color: '#9F7AEA',
      emoji: '🚀'
    }
  ];

  // Si hay metas vencidas, agregarlas al principio
  if (categorizedGoals.overdue.length > 0) {
    goalCategories.unshift({
      id: 'overdue',
      title: '¡Metas vencidas!',
      subtitle: `${categorizedGoals.overdue.length} meta${categorizedGoals.overdue.length !== 1 ? 's' : ''} sin completar`,
      goals: categorizedGoals.overdue,
      color: '#E53E3E',
      emoji: '⚠️'
    });
  }

  const completedGoals = userGoals.filter(goal => goal.isCompleted);
  const totalPoints = completedGoals.reduce((sum, goal) => sum + goal.points, 0);
  const failedGoals = userGoals.filter(goal => !goal.isCompleted);
  const lostPoints = failedGoals.reduce((sum, goal) => sum + goal.points, 0);

  const notifications = [
    {
      id: '1',
      type: 'welcome',
      title: `¡Bienvenido ${userName}!`,
      message: userGoals.length === 0 
        ? 'Comienza creando tu primera meta diaria' 
        : `Tienes ${userGoals.length} meta${userGoals.length !== 1 ? 's' : ''} para hoy`,
      time: 'Ahora',
    }
  ];

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long' 
    });
  };

  const handleToggleGoal = async (goalId: string, completed: boolean) => {
    if (completed) {
      // Encontrar la meta antes de completarla
      const goal = userGoals.find(g => g.id === goalId);
      if (!goal) {
        Alert.alert('Error', 'Meta no encontrada.');
        return;
      }

      Alert.alert(
        '¿Qué pasó con tu meta? 🤔',
        `"${goal.title}"\n\n¿La completaste o no pudiste terminarla?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: '❌ No completé', 
            style: 'destructive',
            onPress: async () => {
              try {
                console.log(`📉 Marcando meta como no completada: ${goal.title}`);
                
                await GoalService.markGoalAsIncomplete(goalId);
                
                // Mostrar feedback para meta no completida
                Alert.alert(
                  'Meta no completada 😔', 
                  `No pasa nada, "${goal.title}" se marcó como no completada.\n\n` +
                  `Perdiste -${goal.points} puntos potenciales, pero ¡puedes crear una nueva meta! 💪`,
                  [{ text: 'Entendido', style: 'default' }]
                );
                
              } catch (error) {
                console.error('❌ Error marking goal as incomplete:', error);
                Alert.alert('Error', 'No se pudo procesar la meta. Inténtalo de nuevo.');
              }
            }
          },
          { 
            text: '✅ Sí completé', 
            onPress: async () => {
              try {
                console.log(`🎯 Completando meta: ${goal.title}`);
                
                await GoalService.completeGoal(goalId);
                
                // Mostrar feedback positivo
                Alert.alert(
                  '¡Excelente! 🏆', 
                  `¡Completaste "${goal.title}"!\n\nHas ganado +${goal.points} puntos 🎯\n\n¡Sigue así!`,
                  [{ text: 'Genial!', style: 'default' }]
                );
                
              } catch (error) {
                console.error('❌ Error completing goal:', error);
                
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                
                Alert.alert(
                  'Error al completar meta', 
                  `No se pudo completar la meta.\n\nDetalle: ${errorMessage}\n\n¿Tienes conexión a internet?`,
                  [
                    { text: 'Reintentar', onPress: () => handleToggleGoal(goalId, completed) },
                    { text: 'Cancelar', style: 'cancel' }
                  ]
                );
              }
            }
          },
        ]
      );
    }
  };

  const GoalCard = ({ goal, compact = false, categoryColor }: { goal: Goal, compact?: boolean, categoryColor?: string }) => {
    const getStatusIcon = () => {
      if (goal.isCompleted) {
        return <Feather name="check" size={12} color="#FFFFFF" />;
      } else if (goal.isIncomplete) {
        return <Feather name="x" size={12} color="#FFFFFF" />;
      } else {
        return <Feather name="circle" size={12} color="#FFFFFF" />;
      }
    };

    const getStatusColor = () => {
      if (goal.isCompleted) return '#38A169';
      if (goal.isIncomplete) return '#E53E3E';
      return categoryColor || '#718096';
    };

    const getBackgroundColor = () => {
      if (goal.isCompleted) return '#F0FFF4';
      if (goal.isIncomplete) return '#FED7D7';
      return '#FFFFFF';
    };

    const getBorderColor = () => {
      if (goal.isCompleted) return '#38A169';
      if (goal.isIncomplete) return '#E53E3E';
      return '#E2E8F0';
    };

    const formatGoalDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getDifficultyEmoji = (difficulty: string) => {
      switch (difficulty) {
        case 'easy': return '😊';
        case 'medium': return '😤';
        case 'hard': return '🔥';
        default: return '⭐';
      }
    };

    return (
      <TouchableOpacity
        style={[
          compact ? styles.goalCardCompact : styles.goalCard,
          { 
            backgroundColor: getBackgroundColor(),
            borderWidth: 1,
            borderColor: getBorderColor()
          }
        ]}
        onPress={() => handleToggleGoal(goal.id, !goal.isCompleted && !goal.isIncomplete)}
        activeOpacity={0.7}
        disabled={goal.isCompleted || goal.isIncomplete} // Deshabilitar si ya está procesada
      >
        <View style={[
          compact ? styles.goalStatusCompact : styles.goalStatus, 
          { backgroundColor: getStatusColor() }
        ]}>
          {getStatusIcon()}
        </View>
        
        <View style={styles.goalContent}>
          <View style={styles.goalHeader}>
            <Text style={[
              compact ? styles.goalTitleCompact : styles.goalTitle, 
              (goal.isCompleted || goal.isIncomplete) && styles.goalTitleCompleted
            ]}>
              {!compact && getDifficultyEmoji(goal.difficulty)} {goal.title}
              {goal.isIncomplete && ' ❌'}
            </Text>
            <Text style={compact ? styles.goalTimeCompact : styles.goalTime}>
              {formatGoalDate(goal.dueDate)}
            </Text>
          </View>
          
          {!compact && goal.description ? (
            <Text style={styles.goalDescription} numberOfLines={1}>
              {goal.description}
            </Text>
          ) : null}
          
          <View style={styles.goalFooter}>
            {!compact && (
              <Text style={styles.goalFrequency}>
                {goal.frequency === 'once' ? 'Una vez' : 
                 goal.frequency === 'daily' ? 'Diaria' : 'Semanal'}
              </Text>
            )}
            <Text style={[
              compact ? styles.goalPointsCompact : styles.goalPoints,
              { color: goal.isCompleted ? '#38A169' : 
                      goal.isIncomplete ? '#E53E3E' : '#2D3748' }
            ]}>
              {goal.isCompleted ? '+' : goal.isIncomplete ? '-' : '+'}{goal.points}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const RankingCard = ({ users, currentUserId }: { users: StoredUser[], currentUserId: string }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Ranking del Grupo</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Team', { currentUserId })}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
          <Feather name="arrow-right" size={16} color="#4299E1" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.rankingList}>
        {users.length === 0 ? (
          <Text style={styles.emptyMessage}>
            Aún no hay otros usuarios en el equipo
          </Text>
        ) : (
          users.slice(0, 5).map((user, index) => {
            const isCurrentUser = user.id === currentUserId;
            const rank = index + 1;
            
            return (
              <View 
                key={user.id}
                style={[
                  styles.rankingItem,
                  rank === 1 ? styles.firstPlace : 
                  isCurrentUser ? styles.currentUser : styles.regularUser
                ]}
              >
                <View style={[
                  styles.rankBadge,
                  { backgroundColor: rank === 1 ? '#F6AD55' : 
                    isCurrentUser ? '#4299E1' : '#A0AEC0' }
                ]}>
                  <Text style={styles.rankNumber}>{rank}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.userName}>
                    {user.name}{isCurrentUser ? ' (Tú)' : ''}
                  </Text>
                </View>
                <Text style={[
                  styles.userPoints,
                  { color: rank === 1 ? '#38A169' : '#2D3748' }
                ]}>
                  {user.points} pts
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, {userName}! 👋</Text>
            <Text style={styles.date}>{formatDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Botón temporal para debug */}
            <TouchableOpacity
              style={[styles.teamButton, { backgroundColor: '#FFE5E5' }]}
              onPress={() => {
                console.log('🔄 Forzando recarga de datos...');
                loadUserData();
              }}
            >
              <Feather name="refresh-cw" size={16} color="#E53E3E" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.teamButton}
              onPress={() => navigation.navigate('Team', { currentUserId: userId })}
            >
              <Feather name="users" size={20} color="#4299E1" />
            </TouchableOpacity>
            <View style={styles.pointsContainer}>
              <Text style={styles.points}>{currentUser?.points || 0}</Text>
              <Text style={styles.pointsLabel}>puntos</Text>
            </View>
          </View>
        </View>

        {/* Goals Categories Carousel */}
        <View style={styles.goalsCarouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselTitle}>Tus Metas</Text>
            <Text style={styles.carouselSubtitle}>Desliza para ver más →</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.goalsCarousel}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={320} // Ancho de cada tarjeta + margen
            decelerationRate="fast"
          >
            {goalCategories.map((category, index) => (
              <View key={category.id} style={[
                styles.goalCategoryCard,
                index === 0 && styles.firstCard,
                index === goalCategories.length - 1 && styles.lastCard
              ]}>
                {/* Header de la categoría */}
                <View style={[styles.categoryHeader, { borderTopColor: category.color }]}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                  </View>
                  <Text style={[styles.categorySubtitle, { color: category.color }]}>
                    {category.subtitle}
                  </Text>
                </View>

                {/* Lista de metas */}
                <View style={styles.categoryGoalsList}>
                  {category.goals.length > 0 ? (
                    category.goals.slice(0, 3).map((goal) => (
                      <GoalCard 
                        key={goal.id} 
                        goal={goal} 
                        compact={true}
                        categoryColor={category.color}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyCategory}>
                      <Text style={styles.emptyCategoryText}>
                        {category.id === 'today' ? 
                          '¡Perfecto! Tienes el día libre 😊' :
                          category.id === 'tomorrow' ?
                          'Planifica metas para mañana' :
                          'No hay metas programadas'
                        }
                      </Text>
                    </View>
                  )}
                  
                  {/* Mostrar "ver más" si hay más de 3 metas */}
                  {category.goals.length > 3 && (
                    <TouchableOpacity style={styles.viewMoreButton}>
                      <Text style={[styles.viewMoreText, { color: category.color }]}>
                        Ver todas ({category.goals.length})
                      </Text>
                      <Feather name="arrow-right" size={14} color={category.color} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Footer con estadísticas */}
                <View style={styles.categoryFooter}>
                  <View style={styles.categoryStats}>
                    <Text style={styles.statLabel}>Completadas:</Text>
                    <Text style={[styles.statValue, { color: '#38A169' }]}>
                      {category.goals.filter(g => g.isCompleted).length}
                    </Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.statLabel}>Puntos:</Text>
                    <Text style={[styles.statValue, { color: category.color }]}>
                      +{category.goals.reduce((sum, g) => sum + (g.isCompleted ? g.points : 0), 0)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Ranking Card */}
        <RankingCard users={allUsers} currentUserId={userId} />

        {/* Notifications Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notificaciones</Text>
          <View style={styles.notificationsList}>
            {notifications.slice(0, 3).map(notification => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Feather name="star" size={16} color="#38A169" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          navigation.navigate('CreateGoal', { userId, userName });
        }}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  date: {
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
  },
  goalCardCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
  },
  goalStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  goalStatusCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    lineHeight: 20,
  },
  goalTitleCompact: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
    lineHeight: 18,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#718096',
  },
  goalPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalPointsCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalContent: {
    flex: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  goalTime: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  goalTimeCompact: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
  goalDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  goalFrequency: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '400',
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
  statLabel: {
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
});

export default DashboardScreen;