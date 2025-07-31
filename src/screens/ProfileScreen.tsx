import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalService } from '../services/GoalService';
import { StoredUser, UserService } from '../services/UserService';
import { RootStackParamList } from '../types/types';

const { width } = Dimensions.get('window');

// Level system with exponential progression
const LEVEL_SYSTEM = [
  { level: 1, minPoints: 0, maxPoints: 50, title: 'Novato' },
  { level: 2, minPoints: 51, maxPoints: 120, title: 'Aprendiz' },
  { level: 3, minPoints: 121, maxPoints: 220, title: 'Estudiante Determinado' },
  { level: 4, minPoints: 221, maxPoints: 350, title: 'Cazador de Metas' },
  { level: 5, minPoints: 351, maxPoints: 500, title: 'Guerrero Anti-Procrastinación' },
  { level: 6, minPoints: 501, maxPoints: 700, title: 'Estratega Productivo' },
  { level: 7, minPoints: 701, maxPoints: 950, title: 'Maestro del Tiempo' },
  { level: 8, minPoints: 951, maxPoints: 1250, title: 'Líder de Productividad' },
  { level: 9, minPoints: 1251, maxPoints: 1600, title: 'Leyenda Viviente' },
  { level: 10, minPoints: 1601, maxPoints: 2000, title: 'Maestro de la Productividad' },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'settings'>('stats');
  const [showAchievementModal, setShowAchievementModal] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Animation values
  const progressAnimation = new Animated.Value(0);

  const getUserId = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('currentUserId');
      return storedUserId || 'user-cesar-1753750573601';
    } catch (error) {
      console.error('Error getting userId:', error);
      return 'user-cesar-1753750573601';
    }
  }, []);

  // Enhanced user level calculation
  const userLevel = useMemo(() => {
    const points = currentUser?.points || 0;
    const levelData = LEVEL_SYSTEM.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVEL_SYSTEM[LEVEL_SYSTEM.length - 1];
    const progress = levelData.level < 10 ? 
      ((points - levelData.minPoints) / (levelData.maxPoints - levelData.minPoints)) * 100 : 100;
    const pointsToNext = levelData.level < 10 ? levelData.maxPoints - points : 0;

    return {
      ...levelData,
      progress: Math.max(0, Math.min(100, progress)),
      pointsToNext
    };
  }, [currentUser?.points]);

  // Comprehensive statistics
  const userStats = useMemo(() => {
    const completedGoals = goals.filter(goal => goal.isCompleted);
    const totalGoals = goals.length;
    const successRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
    
    // Calculate streaks and patterns
    const now = new Date();
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisWeekGoals = completedGoals.filter(g => new Date(g.completedAt || '') >= thisWeekStart);
    const thisMonthGoals = completedGoals.filter(g => new Date(g.completedAt || '') >= thisMonthStart);
    
    const publicGoals = goals.filter(g => g.isPublic);
    const publicCompletedGoals = completedGoals.filter(g => g.isPublic);

    return {
      completedGoals: completedGoals.length,
      totalGoals,
      successRate: Math.round(successRate),
      currentStreak: currentUser?.streak || 0,
      longestStreak: currentUser?.longestStreak || currentUser?.streak || 0,
      thisWeekPoints: thisWeekGoals.reduce((sum, g) => sum + (g.points || 0), 0),
      thisMonthPoints: thisMonthGoals.reduce((sum, g) => sum + (g.points || 0), 0),
      publicGoals: publicGoals.length,
      publicCompleted: publicCompletedGoals.length,
      averageCompletionTime: completedGoals.length > 0 ? 
        completedGoals.reduce((sum, g) => {
          const created = new Date(g.createdAt);
          const completed = new Date(g.completedAt || '');
          return sum + (completed.getTime() - created.getTime());
        }, 0) / completedGoals.length / (1000 * 60 * 60 * 24) : 0 // days
    };
  }, [goals, currentUser]);

  // Enhanced achievements system
  const achievements = useMemo(() => [
    // First Steps
    {
      id: 'first-goal',
      title: 'Primera Meta',
      description: 'Completaste tu primera meta',
      icon: 'target',
      category: 'firstSteps',
      unlocked: userStats.completedGoals >= 1,
      color: '#38A169',
      rarity: 'common'
    },
    {
      id: 'first-week',
      title: 'Primera Semana',
      description: 'Mantuviste una racha de 7 días',
      icon: 'calendar',
      category: 'firstSteps',
      unlocked: userStats.currentStreak >= 7,
      color: '#4299E1',
      rarity: 'common'
    },
    {
      id: 'social-start',
      title: 'Primer Amigo',
      description: 'Completaste tu primera meta pública',
      icon: 'users',
      category: 'firstSteps',
      unlocked: userStats.publicCompleted >= 1,
      color: '#9F7AEA',
      rarity: 'common'
    },

    // Streaks
    {
      id: 'streak-7',
      title: 'Semana Perfecta',
      description: 'Racha de 7 días consecutivos',
      icon: 'zap',
      category: 'streaks',
      unlocked: userStats.currentStreak >= 7,
      color: '#ED8936',
      rarity: 'uncommon'
    },
    {
      id: 'streak-15',
      title: 'Quincenal Imparable',
      description: 'Racha de 15 días consecutivos',
      icon: 'trending-up',
      category: 'streaks',
      unlocked: userStats.currentStreak >= 15,
      color: '#D69E2E',
      rarity: 'rare'
    },
    {
      id: 'streak-30',
      title: 'Mes Legendario',
      description: 'Racha de 30 días consecutivos',
      icon: 'star',
      category: 'streaks',
      unlocked: userStats.currentStreak >= 30,
      color: '#E53E3E',
      rarity: 'epic'
    },

    // Points
    {
      id: 'points-100',
      title: 'Centenario',
      description: 'Acumula 100 puntos',
      icon: 'award',
      category: 'points',
      unlocked: (currentUser?.points || 0) >= 100,
      color: '#38A169',
      rarity: 'common'
    },
    {
      id: 'points-500',
      title: 'Medio Millón',
      description: 'Acumula 500 puntos',
      icon: 'gift',
      category: 'points',
      unlocked: (currentUser?.points || 0) >= 500,
      color: '#4299E1',
      rarity: 'uncommon'
    },
    {
      id: 'points-1000',
      title: 'Millar Dorado',
      description: 'Acumula 1000 puntos',
      icon: 'star',
      category: 'points',
      unlocked: (currentUser?.points || 0) >= 1000,
      color: '#D69E2E',
      rarity: 'rare'
    },

    // Social
    {
      id: 'social-butterfly',
      title: 'Mariposa Social',
      description: 'Completa 3 metas públicas',
      icon: 'heart',
      category: 'social',
      unlocked: userStats.publicCompleted >= 3,
      color: '#E53E3E',
      rarity: 'uncommon'
    },
    {
      id: 'influencer',
      title: 'Influencer',
      description: 'Completa 10 metas públicas',
      icon: 'share-2',
      category: 'social',
      unlocked: userStats.publicCompleted >= 10,
      color: '#9F7AEA',
      rarity: 'rare'
    },

    // Consistency
    {
      id: 'perfectionist',
      title: 'Perfeccionista',
      description: '100% de tasa de éxito con 5+ metas',
      icon: 'check-circle',
      category: 'consistency',
      unlocked: userStats.successRate === 100 && userStats.totalGoals >= 5,
      color: '#38A169',
      rarity: 'epic'
    },
    {
      id: 'unstoppable',
      title: 'Imparable',
      description: 'Completa 20 metas',
      icon: 'shield',
      category: 'consistency',
      unlocked: userStats.completedGoals >= 20,
      color: '#2D3748',
      rarity: 'legendary'
    }
  ], [userStats, currentUser?.points]);

  // User ranking
  const userRanking = useMemo(() => {
    const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);
    const userPosition = sortedUsers.findIndex(user => user.id === (currentUser?.id || '')) + 1;
    const percentile = allUsers.length > 0 ? Math.round((1 - (userPosition - 1) / allUsers.length) * 100) : 0;
    
    return {
      position: userPosition,
      total: allUsers.length,
      percentile
    };
  }, [allUsers, currentUser?.id]);

  // Motivational phrases based on progress
  const motivationalPhrase = useMemo(() => {
    const phrases = {
      novice: ['¡Vas por buen camino!', '¡Cada paso cuenta!', '¡El viaje comienza aquí!'],
      intermediate: ['¡Imparable!', '¡Vas genial!', '¡Sigue así, campeón!'],
      advanced: ['¡Leyenda viviente!', '¡Eres increíble!', '¡Maestro de la productividad!']
    };
    
    const level = userLevel.level;
    let category = 'novice';
    if (level >= 3 && level <= 7) category = 'intermediate';
    if (level >= 8) category = 'advanced';
    
    const categoryPhrases = phrases[category];
    return categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
  }, [userLevel.level]);

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

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Enhanced Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Feather name="award" size={20} color="#D69E2E" />
          <Text style={styles.statNumber}>{currentUser?.points || 0}</Text>
          <Text style={styles.statLabel}>Puntos Totales</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="target" size={20} color="#38A169" />
          <Text style={styles.statNumber}>{userStats.completedGoals}</Text>
          <Text style={styles.statLabel}>Metas Completadas</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="percent" size={20} color="#4299E1" />
          <Text style={styles.statNumber}>{userStats.successRate}%</Text>
          <Text style={styles.statLabel}>Tasa de Éxito</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="zap" size={20} color="#E53E3E" />
          <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
          <Text style={styles.statLabel}>Racha Actual</Text>
        </View>
      </View>

      {/* Detailed Analytics */}
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>📊 Análisis Detallado</Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Esta Semana</Text>
            <Text style={styles.analyticsValue}>{userStats.thisWeekPoints} pts</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Este Mes</Text>
            <Text style={styles.analyticsValue}>{userStats.thisMonthPoints} pts</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Racha Máxima</Text>
            <Text style={styles.analyticsValue}>{userStats.longestStreak} días</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Tiempo Promedio</Text>
            <Text style={styles.analyticsValue}>{Math.round(userStats.averageCompletionTime)} días</Text>
          </View>
        </View>

        {/* Social Comparison */}
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>🏆 Tu Posición</Text>
          <Text style={styles.comparisonText}>
            Estás en el puesto #{userRanking.position} de {userRanking.total}
          </Text>
          <Text style={styles.comparisonSubtext}>
            Mejor que el {userRanking.percentile}% de usuarios
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAchievementsTab = () => {
    const categories = ['firstSteps', 'streaks', 'points', 'social', 'consistency'];
    const categoryNames = {
      firstSteps: '🌱 Primeros Pasos',
      streaks: '⚡ Rachas',
      points: '💎 Puntos',
      social: '👥 Social',
      consistency: '🎯 Consistencia'
    };

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>
          🏆 Logros ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </Text>
        
        {categories.map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;
          
          return (
            <View key={category} style={styles.achievementCategory}>
              <Text style={styles.categoryTitle}>
                {categoryNames[category]} ({unlockedCount}/{categoryAchievements.length})
              </Text>
              <View style={styles.achievementsList}>
                {categoryAchievements.map(achievement => (
                  <TouchableOpacity
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked
                    ]}
                    onPress={() => setShowAchievementModal(achievement)}
                  >
                    <View style={[
                      styles.achievementIcon,
                      { backgroundColor: achievement.unlocked ? achievement.color : '#A0AEC0' }
                    ]}>
                      <Feather 
                        name={achievement.icon} 
                        size={16} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <Text style={[
                      styles.achievementTitle,
                      { color: achievement.unlocked ? '#2D3748' : '#A0AEC0' }
                    ]}>
                      {achievement.title}
                    </Text>
                    {achievement.unlocked && (
                      <View style={styles.rarityBadge}>
                        <Text style={[styles.rarityText, { 
                          color: achievement.rarity === 'legendary' ? '#D69E2E' : 
                                achievement.rarity === 'epic' ? '#9F7AEA' :
                                achievement.rarity === 'rare' ? '#4299E1' : '#38A169'
                        }]}>
                          {achievement.rarity}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
      
      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="camera" size={20} color="#4299E1" />
          <Text style={styles.settingText}>Cambiar foto de perfil</Text>
          <Feather name="chevron-right" size={16} color="#A0AEC0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="edit-3" size={20} color="#38A169" />
          <Text style={styles.settingText}>Editar nombre</Text>
          <Feather name="chevron-right" size={16} color="#A0AEC0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="bell" size={20} color="#ED8936" />
          <Text style={styles.settingText}>Notificaciones</Text>
          <Feather name="chevron-right" size={16} color="#A0AEC0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="shield" size={20} color="#9F7AEA" />
          <Text style={styles.settingText}>Privacidad</Text>
          <Feather name="chevron-right" size={16} color="#A0AEC0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="dollar-sign" size={20} color="#E53E3E" />
          <Text style={styles.settingText}>Configurar apuestas</Text>
          <Feather name="chevron-right" size={16} color="#A0AEC0" />
        </TouchableOpacity>
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
    </View>
  );

  useEffect(() => {
    loadData();

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

  // Animate progress bar when user data changes
  useEffect(() => {
    if (currentUser && !isLoading) {
      Animated.timing(progressAnimation, {
        toValue: userLevel.progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [currentUser, userLevel.progress, isLoading]);

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
        {/* Enhanced Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            )}
            <View style={styles.avatarBadge}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{currentUser?.name}</Text>
          <Text style={styles.userTitle}>{userLevel.title}</Text>
          <Text style={styles.motivationalPhrase}>{motivationalPhrase}</Text>
          
          {/* Enhanced Level Progress */}
          <View style={styles.levelContainer}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Nivel {userLevel.level}</Text>
              {userLevel.level < 10 && (
                <Text style={styles.pointsToNext}>
                  {userLevel.pointsToNext} pts para nivel {userLevel.level + 1}
                </Text>
              )}
            </View>
            
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp'
                    })
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Feather name="bar-chart-2" size={16} color={activeTab === 'stats' ? '#FFFFFF' : '#718096'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Estadísticas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Feather name="award" size={16} color={activeTab === 'achievements' ? '#FFFFFF' : '#718096'} />
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              Logros
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Feather name="settings" size={16} color={activeTab === 'settings' ? '#FFFFFF' : '#718096'} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Configuración
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </ScrollView>

      {/* Achievement Modal */}
      <Modal
        visible={!!showAchievementModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAchievementModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {showAchievementModal && (
              <>
                <View style={[
                  styles.modalIcon,
                  { backgroundColor: showAchievementModal.color }
                ]}>
                  <Feather 
                    name={showAchievementModal.icon} 
                    size={32} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.modalTitle}>{showAchievementModal.title}</Text>
                <Text style={styles.modalDescription}>
                  {showAchievementModal.description}
                </Text>
                <View style={styles.modalRarity}>
                  <Text style={[styles.modalRarityText, {
                    color: showAchievementModal.rarity === 'legendary' ? '#D69E2E' : 
                          showAchievementModal.rarity === 'epic' ? '#9F7AEA' :
                          showAchievementModal.rarity === 'rare' ? '#4299E1' : '#38A169'
                  }]}>
                    {showAchievementModal.rarity.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowAchievementModal(null)}
                >
                  <Text style={styles.modalButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  },
  profileHeader: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: '#4A5568',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4299E1',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2D3748',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  motivationalPhrase: {
    fontSize: 14,
    color: '#CBD5E0',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  levelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pointsToNext: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#4A5568',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38A169',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
  },
  activeTab: {
    backgroundColor: '#2D3748',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  comparisonSubtext: {
    fontSize: 12,
    color: '#718096',
  },
  achievementCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (width - 44) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  settingText: {
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 12,
    flex: 1,
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
    backgroundColor: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    marginHorizontal: 20,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalRarity: {
    marginBottom: 16,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default React.memo(ProfileScreen);