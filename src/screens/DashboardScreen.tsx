import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService, StoredUser } from '../services/UserService';
import { GoalService, Goal } from '../services/GoalService';
import { RootStackParamList } from '../types/types';
import { CategoryGoalsModal, GoalDetailModal } from '../components/DashboardModals';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const goalsCarouselRef = useRef<ScrollView>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ title: string; goals: Goal[]; color: string } | null>(null);
  const [goalDetailModalVisible, setGoalDetailModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  // Derivar listas de metas desde allGoals
  const userGoals = allGoals.filter(goal => goal.userId === currentUser?.id);
  const publicGoals = allGoals.filter(goal => goal.isPublic);

  // Calcular puntos en tiempo real basado en metas completadas
  const completedGoals = userGoals.filter(goal => goal.isCompleted);
  const currentUserPoints = completedGoals.reduce((sum, goal) => sum + goal.points, 0);

  const handleViewMore = (category: { title: string; goals: Goal[]; color: string }) => {
    setSelectedCategory(category);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedCategory(null);
  };

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

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userId = await getUserId();
      
      const [user, users, goals] = await Promise.all([
        UserService.getUser(userId),
        UserService.getAllUsers(),
        GoalService.getAllGoals(),
      ]);

      setCurrentUser(user);
      const sortedUsers = users.sort((a, b) => b.points - a.points);
      setAllUsers(sortedUsers);
      setAllGoals(goals);
      
      console.log('📋 Dashboard cargado para:', user?.name);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Usar useFocusEffect para recargar cuando la tab esté activa
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();

      // Escuchar cambios en tiempo real
      const unsubscribeUsers = UserService.listenToUsers((users) => {
        // Filtrar usuarios duplicados - mantener solo los que tienen ID de Firebase (empiezan con -)
        // Si hay usuarios duplicados por nombre, preferir el que tiene ID generado por Firebase
        const uniqueUsers = users.reduce((acc, user) => {
          const existingUser = acc.find(u => u.name.toLowerCase() === user.name.toLowerCase());
          
          if (!existingUser) {
            // No existe, agregar este usuario
            acc.push(user);
          } else {
            // Ya existe un usuario con este nombre
            // Preferir el que tiene ID generado por Firebase (empieza con -)
            if (user.id.startsWith('-') && !existingUser.id.startsWith('-')) {
              // El nuevo usuario tiene ID de Firebase, reemplazar el anterior
              const index = acc.findIndex(u => u.name.toLowerCase() === user.name.toLowerCase());
              acc[index] = user;
            }
            // Si ambos tienen ID de Firebase o ambos tienen ID personalizado, mantener el existente
          }
          
          return acc;
        }, [] as StoredUser[]);
        
        const sortedUsers = uniqueUsers.sort((a, b) => b.points - a.points);
        setAllUsers(sortedUsers);
        
        console.log(`👥 Usuarios únicos: ${uniqueUsers.length} (filtrados de ${users.length} total)`);
      });

      const unsubscribeGoals = GoalService.listenToGoals(setAllGoals);

      return () => {
        unsubscribeUsers();
        unsubscribeGoals();
      };
    }, [])
  );

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
    
    // Una meta está vencida si su fecha es anterior a hoy Y no ha sido procesada.
    if (goalDateOnly < today && !goal.isCompleted && !goal.isIncomplete) {
      acc.overdue.push(goal);
    } else if (goalDateOnly.getTime() === today.getTime()) {
      acc.today.push(goal);
    } else if (goalDateOnly.getTime() === tomorrow.getTime()) {
      acc.tomorrow.push(goal);
    } else if (goalDateOnly > tomorrow && goalDateOnly <= thisWeekEnd) {
      acc.thisWeek.push(goal);
    } else if (goalDateOnly > thisWeekEnd) {
      acc.later.push(goal);
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

  // Efecto para centrar las metas de "Hoy" si existen metas "Vencidas"
  useEffect(() => {
    const hasOverdueGoals = goalCategories.find(c => c.id === 'overdue');
    if (hasOverdueGoals) {
      // Usamos un timeout para asegurar que el scrollview se haya renderizado
      setTimeout(() => {
        goalsCarouselRef.current?.scrollTo({ x: 316, animated: false });
      }, 100);
    }
  }, [goalCategories, isLoading]);

  const failedGoals = userGoals.filter(goal => !goal.isCompleted);
  const lostPoints = failedGoals.reduce((sum, goal) => sum + goal.points, 0);

  const commitmentNotifications = publicGoals
    .filter(goal => goal.userId !== currentUser?.id && !goal.isCompleted && !goal.isIncomplete)
    .map(goal => {
      const goalUser = allUsers.find(u => u.id === goal.userId);
      return {
        id: goal.id,
        type: 'commitment',
        title: `¡Nuevo Compromiso Público!`,
        message: `${goalUser?.name || 'Alguien'} se comprometió a: "${goal.title}"`,
        time: 'Reciente',
      };
    });

  const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const completedGoalNotifications = allGoals
    .filter(goal => 
      goal.isCompleted && 
      goal.userId !== currentUser?.id && 
      goal.completedAt && new Date(goal.completedAt) > twentyFourHoursAgo
    )
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .map(goal => {
      const goalUser = allUsers.find(u => u.id === goal.userId);
      return {
        id: `completed-${goal.id}`,
        type: 'completed_goal',
        title: `¡Meta Cumplida!`,
        message: `${goalUser?.name || 'Alguien'} completó "${goal.title}" y ganó +${goal.points} puntos.`,
        time: 'Reciente',
      };
    });

  const allGeneratedNotifications = [
    {
      id: 'welcome-1',
      type: 'welcome',
      title: `¡Bienvenido ${currentUser?.name}!`,
      message: userGoals.length === 0 
        ? 'Comienza creando tu primera meta diaria' 
        : `Tienes ${userGoals.length} meta${userGoals.length !== 1 ? 's' : ''} para hoy`,
      time: 'Ahora',
    },
    ...commitmentNotifications,
    ...completedGoalNotifications,
  ];

  const notifications = allGeneratedNotifications.filter(
    notification => !dismissedNotificationIds.includes(notification.id)
  );

  const handleDismissNotification = (notificationId: string) => {
    setDismissedNotificationIds(prevIds => [...prevIds, notificationId]);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long' 
    });
  };

  const handleGoalPress = (goal: Goal) => {
    if (!goal.isCompleted && !goal.isIncomplete) {
      setSelectedGoal(goal);
      setGoalDetailModalVisible(true);
    }
  };

  const handleCompleteGoal = async () => {
    if (!selectedGoal) return;
    const goalId = selectedGoal.id;
    const goalTitle = selectedGoal.title;
    const goalPoints = selectedGoal.points;

    setGoalDetailModalVisible(false);

    try {
      console.log(`🎯 Completando meta: ${goalTitle}`);
      await GoalService.completeGoal(goalId);
      
      // NO actualizar el usuario aquí - dejar que los puntos se calculen en tiempo real
      
      Alert.alert(
        '¡Excelente! 🏆', 
        `¡Completaste "${goalTitle}"!\n\nHas ganado +${goalPoints} puntos 🎯\n\n¡Sigue así!`,
        [{ text: 'Genial!', style: 'default' }]
      );
    } catch (error) {
      console.error('❌ Error completing goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert(
        'Error al completar meta', 
        `No se pudo completar la meta.\n\nDetalle: ${errorMessage}`,
        [{ text: 'Entendido' }]
      );
    } finally {
      setSelectedGoal(null);
    }
  };

  const handleIncompleteGoal = async () => {
    if (!selectedGoal) return;
    const goalId = selectedGoal.id;
    const goalTitle = selectedGoal.title;
    const goalPoints = selectedGoal.points;

    setGoalDetailModalVisible(false);

    try {
      console.log(`📉 Marcando meta como no completada: ${goalTitle}`);
      await GoalService.markGoalAsIncomplete(goalId);
      
      Alert.alert(
        'Meta no completada 😔', 
        `No pasa nada, "${goalTitle}" se marcó como no completada.\n\n` +
        `Perdiste -${goalPoints} puntos potenciales, pero ¡puedes crear una nueva meta! 💪`,
        [{ text: 'Entendido', style: 'default' }]
      );
    } catch (error) {
      console.error('❌ Error marking goal as incomplete:', error);
      Alert.alert('Error', 'No se pudo procesar la meta. Inténtalo de nuevo.');
    } finally {
      setSelectedGoal(null);
    }
  };

  const GoalCard = ({ goal, compact = false, categoryColor, isOverdue = false }: { goal: Goal, compact?: boolean, categoryColor?: string, isOverdue?: boolean }) => {
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
        onPress={() => handleGoalPress(goal)}
        activeOpacity={0.7}
        disabled={!isOverdue && (goal.isCompleted || goal.isIncomplete)} // Habilitar si es vencida, de lo contrario deshabilitar si ya está procesada
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
      {/* Header fijo */}
      <View style={styles.fixedHeader}>
        <View>
          <Text style={styles.greeting}>¡Hola, {currentUser?.name || 'Usuario'}! 👋</Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={async () => {
              const userId = await getUserId();
              navigation.navigate('Team', { currentUserId: userId });
            }}
          >
            <Feather name="users" size={20} color="#4299E1" />
          </TouchableOpacity>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>{currentUserPoints}</Text>
            <Text style={styles.pointsLabel}>puntos</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollViewWithHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 114 }} // Aumentado para el nuevo alto del header
      >
        {/* Goals Categories Carousel */}
        <View style={styles.goalsCarouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselTitle}>Tus Metas</Text>
            <Text style={styles.carouselSubtitle}>Desliza para ver más →</Text>
          </View>
          
          <ScrollView 
            ref={goalsCarouselRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.goalsCarousel}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={320}
            decelerationRate="fast"
          >
            {goalCategories.map((category, index) => (
              <View key={category.id} style={[
                styles.goalCategoryCard,
                index === 0 && styles.firstCard,
                index === goalCategories.length - 1 && styles.lastCard
              ]}>
                {/* Header de la categoría sin emoji */}
                <View style={[styles.categoryHeader, { borderTopColor: category.color }]}>
                  <View style={styles.categoryTitleRow}>
                    {/* <Text style={styles.categoryEmoji}>{category.emoji}</Text> */}
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
                        isOverdue={category.id === 'overdue'}
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
                    <TouchableOpacity 
                      style={styles.viewMoreButton}
                      onPress={() => handleViewMore({ 
                        title: category.title, 
                        goals: category.goals,
                        color: category.color
                      })}
                    >
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

        {/* Spacer Text */}
        <Text> </Text>

        {/* Notifications Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notificaciones</Text>
          <View style={styles.notificationsList}>
            {notifications.slice(0, 4).map(notification => (
              <View key={notification.id} style={[
                styles.notificationItem,
                notification.type === 'commitment' && styles.commitmentNotification,
                notification.type === 'completed_goal' && styles.completedGoalNotification,
              ]}>
                <View style={styles.notificationIcon}>
                  <Feather 
                    name={
                      notification.type === 'commitment' ? 'target' :
                      notification.type === 'completed_goal' ? 'check-circle' : 'star'
                    } 
                    size={16} 
                    color={
                      notification.type === 'commitment' ? '#ED8936' :
                      notification.type === 'completed_goal' ? '#38A169' : '#38A169'
                    } 
                  />
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
                <TouchableOpacity 
                  style={styles.dismissButton}
                  onPress={() => handleDismissNotification(notification.id)}
                >
                  <Feather name="x" size={16} color="#A0AEC0" />
                </TouchableOpacity>
              </View>
            ))}
            {notifications.length === 0 && (
              <Text style={styles.emptyMessage}>No hay notificaciones nuevas.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal para ver todas las metas de una categoría */}
      <CategoryGoalsModal 
        visible={isModalVisible}
        onClose={handleCloseModal}
        category={selectedCategory}
      />

      {/* Modal para detalles de una meta */}
      <GoalDetailModal 
        visible={goalDetailModalVisible}
        onClose={() => {
          setGoalDetailModalVisible(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onComplete={handleCompleteGoal}
        onIncomplete={handleIncompleteGoal}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={async () => {
          const userId = await getUserId();
          navigation.navigate('CreateGoal', { userId, userName: currentUser?.name || '' });
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#FFFFFF', // Cambiado a blanco
    paddingHorizontal: 16,
    paddingTop: 40, // Aumentado para bajar los elementos
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  scrollViewWithHeader: {
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
  headerButton: {
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
    marginBottom: 12, // Reducido para combinar con el texto espaciador
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
  // Elimina el emoji visualmente
  categoryEmoji: {
    display: 'none',
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
  commitmentNotification: {
    backgroundColor: '#FFFAF0', // Un color naranja claro para diferenciar
  },
  completedGoalNotification: {
    backgroundColor: '#F0FFF4', // Un color verde claro
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
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#718096',
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24, // Ajustado para estar más abajo
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