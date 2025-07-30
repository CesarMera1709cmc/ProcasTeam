import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../types/types';
import { UserService, StoredUser } from '../services/UserService';

type TeamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Team'>;
type TeamScreenRouteProp = RouteProp<RootStackParamList, 'Team'>;

interface TeamScreenProps {
  navigation: TeamScreenNavigationProp;
  route: TeamScreenRouteProp;
}

const TeamScreen: React.FC<TeamScreenProps> = ({ navigation, route }) => {
  const { currentUserId } = route.params;
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = async () => {
    try {
      const allUsers = await UserService.getAllUsers();
      const sortedUsers = allUsers.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpiar datos',
      '¿Estás seguro de que quieres eliminar todos los usuarios? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await UserService.clearAllUsers();
            await loadUsers();
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadUsers();

    // Escuchar cambios en tiempo real
    const unsubscribe = UserService.listenToUsers((allUsers) => {
      const sortedUsers = allUsers.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });
      setUsers(sortedUsers);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipo</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearData}
        >
          <Feather name="trash-2" size={20} color="#E53E3E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {users.length} usuario{users.length !== 1 ? 's' : ''} en el equipo
          </Text>
        </View>

        <View style={styles.usersList}>
          {users.map((user, index) => {
            const isCurrentUser = user.id === currentUserId;
            const rank = index + 1;
            
            return (
              <View 
                key={user.id}
                style={[
                  styles.userCard,
                  rank === 1 ? styles.firstPlace : 
                  isCurrentUser ? styles.currentUser : styles.regularUser
                ]}
              >
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <View style={[
                      styles.rankBadge,
                      { backgroundColor: rank === 1 ? '#F6AD55' : 
                        isCurrentUser ? '#4299E1' : '#A0AEC0' }
                    ]}>
                      <Text style={styles.rankNumber}>{rank}</Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>
                        {user.name}{isCurrentUser ? ' (Tú)' : ''}
                      </Text>
                      <Text style={styles.userType}>
                        {user.userType === 'user1' ? 'Usuario 1' : 'Usuario 2'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.userPoints,
                      { color: rank === 1 ? '#38A169' : '#2D3748' }
                    ]}>
                      {user.points} pts
                    </Text>
                  </View>
                  
                  <View style={styles.userMetadata}>
                    <Text style={styles.metadataText}>
                      Se unió: {formatDate(user.joinedAt)}
                    </Text>
                    <Text style={styles.metadataText}>
                      Última actividad: {formatDate(user.lastActive)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          
          {users.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="users" size={48} color="#A0AEC0" />
              <Text style={styles.emptyStateText}>
                Aún no hay usuarios en el equipo
              </Text>
              <Text style={styles.emptyStateSubtext}>
                ¡Invita a tus amigos a unirse!
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  clearButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#4299E1',
    fontWeight: '600',
  },
  usersList: {
    gap: 12,
    paddingBottom: 20,
  },
  userCard: {
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
  },
  firstPlace: {
    borderWidth: 2,
    borderColor: '#F6AD55',
    backgroundColor: '#FFFBEB',
  },
  currentUser: {
    borderWidth: 2,
    borderColor: '#4299E1',
    backgroundColor: '#EBF8FF',
  },
  regularUser: {
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    gap: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  userType: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  userPoints: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userMetadata: {
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#718096',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
});

export default TeamScreen;