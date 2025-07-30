import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/types';
import { UserService, StoredUser } from '../services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [existingUsers, setExistingUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExistingUsers();
  }, []);

  const loadExistingUsers = async () => {
    try {
      setIsLoading(true);
      const users = await UserService.getAllUsers();
      setExistingUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = (userType: string) => {
    // Navegar a la pantalla de captura de nombre
    navigation.navigate('UserInput', { userType });
  };

  const selectExistingUser = async (user: StoredUser) => {
    try {
      // Guardar el ID del usuario seleccionado en AsyncStorage
      await AsyncStorage.setItem('currentUserId', user.id);
      
      // Navegar directo al Dashboard
      navigation.replace('Dashboard', {
        userId: user.id,
        userName: user.name
      });
    } catch (error) {
      console.error('Error selecting user:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../images/procasteamlogo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.welcomeText}>Bienvenido a ProcasTeam</Text>
            <Text style={styles.subtitle}>
              Vence la procrastinación con presión social positiva. Únete con amigos, comparte tus metas diarias, y mantén la responsabilidad grupal.
            </Text>
          </View>

          {/* Usuarios Existentes */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D3748" />
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : existingUsers.length > 0 ? (
            <View style={styles.existingUsersSection}>
              <Text style={styles.sectionTitle}>Continuar como:</Text>
              <View style={styles.existingUsersContainer}>
                {existingUsers.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.existingUserCard}
                    onPress={() => selectExistingUser(user)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>{user.name[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <View style={styles.userStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{user.points}</Text>
                          <Text style={styles.statLabel}>puntos</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{user.streak}</Text>
                          <Text style={styles.statLabel}>racha</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.chevron}>
                      <Text style={styles.chevronText}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Botón para crear nuevo usuario */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => selectUser('user')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                ➕ Crear Nuevo Usuario
              </Text>
            </TouchableOpacity>
          </View>

          {existingUsers.length === 0 && !isLoading && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateEmoji}>🎯</Text>
              <Text style={styles.emptyStateTitle}>¡Comienza tu viaje!</Text>
              <Text style={styles.emptyStateDescription}>
                Crea tu primer usuario y comienza a vencer la procrastinación junto a tu equipo.
              </Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
  },
  existingUsersSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  existingUsersContainer: {
    gap: 12,
  },
  existingUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatar: {
    width: 56,
    height: 56,
    backgroundColor: '#2D3748',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38A169',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  chevron: {
    marginLeft: 12,
  },
  chevronText: {
    fontSize: 24,
    color: '#A0AEC0',
    fontWeight: '300',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2D3748',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 32,
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
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HomeScreen;