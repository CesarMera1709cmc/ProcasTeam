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

interface AppBlockerScreenProps {
  navigation: any;
  route: any;
}

const AppBlockerScreen: React.FC<AppBlockerScreenProps> = ({ navigation, route }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = route?.params?.userId || 'user-cesar-1753750573601';

  // Apps a monitorear - datos estáticos memoizados
  const appsToBlock = useMemo(() => [
    { name: 'TikTok', icon: 'music', color: '#FF0050', blocked: true },
    { name: 'Instagram', icon: 'instagram', color: '#E4405F', blocked: true },
    { name: 'Twitter', icon: 'twitter', color: '#1DA1F2', blocked: false },
    { name: 'YouTube', icon: 'youtube', color: '#FF0000', blocked: true },
    { name: 'Facebook', icon: 'facebook', color: '#1877F2', blocked: false },
    { name: 'WhatsApp', icon: 'message-circle', color: '#25D366', blocked: false },
  ], []);

  // Calcular estadísticas memoizadas
  const blockedAppsCount = useMemo(() => 
    appsToBlock.filter(app => app.blocked).length, 
    [appsToBlock]
  );

  const totalTimesSaved = useMemo(() => 
    blockedAppsCount * 15, // 15 minutos por app bloqueada
    [blockedAppsCount]
  );

  const activeGoals = useMemo(() => 
    goals.filter(goal => !goal.isCompleted && !goal.isIncomplete),
    [goals]
  );

  // Callbacks optimizados
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [user, userGoals] = await Promise.all([
        UserService.getUser(userId),
        GoalService.getUserGoals(userId)
      ]);
      
      setCurrentUser(user);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleCreateGoal = useCallback(() => {
    navigation.navigate('CreateGoal', { userId, userName: currentUser?.name });
  }, [navigation, userId, currentUser?.name]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Componente memoizado para apps
  const AppCard = React.memo(({ app }: { app: any }) => (
    <View style={[styles.appCard, app.blocked && styles.appCardBlocked]}>
      <View style={[styles.appIcon, { backgroundColor: app.color }]}>
        <Feather name={app.icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{app.name}</Text>
        <Text style={[
          styles.appStatus,
          { color: app.blocked ? '#E53E3E' : '#38A169' }
        ]}>
          {app.blocked ? '🔒 Bloqueada' : '✅ Disponible'}
        </Text>
      </View>
      {app.blocked && (
        <View style={styles.blockedBadge}>
          <Feather name="shield" size={16} color="#E53E3E" />
        </View>
      )}
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
        {/* Header con estadísticas */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bloqueador de Apps 🛡️</Text>
          <Text style={styles.headerSubtitle}>
            {blockedAppsCount} apps bloqueadas • {totalTimesSaved} min ahorrados hoy
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Feather name="shield" size={24} color="#E53E3E" />
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{blockedAppsCount}</Text>
              <Text style={styles.statLabel}>Apps Bloqueadas</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Feather name="clock" size={24} color="#38A169" />
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{totalTimesSaved}</Text>
              <Text style={styles.statLabel}>Min Ahorrados</Text>
            </View>
          </View>
        </View>

        {/* Apps Grid */}
        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Apps Monitoreadas</Text>
          <View style={styles.appsGrid}>
            {appsToBlock.map((app, index) => (
              <AppCard key={index} app={app} />
            ))}
          </View>
        </View>

        {/* Motivación */}
        {activeGoals.length > 0 && (
          <View style={styles.motivationCard}>
            <View style={styles.motivationHeader}>
              <Feather name="target" size={24} color="#D69E2E" />
              <Text style={styles.motivationTitle}>
                Tienes {activeGoals.length} metas activas
              </Text>
            </View>
            <Text style={styles.motivationText}>
              ¡Completa tus metas para desbloquear automáticamente las apps! 
              Mantén el enfoque y alcanza tus objetivos.
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNavigation 
        navigation={navigation} 
        currentScreen="AppBlocker"
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
    color: '#718096',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statInfo: {
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  appsSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  appsGrid: {
    gap: 12,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  appCardBlocked: {
    backgroundColor: '#FED7D7',
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  appStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  blockedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  motivationCard: {
    backgroundColor: '#FFFBEA',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F6E05E',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
  },
  motivationText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
});

export default React.memo(AppBlockerScreen);