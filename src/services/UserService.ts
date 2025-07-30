import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, ref, set, onValue, off, get } from './FirebaseService';

export interface StoredUser {
  id: string;
  name: string;
  userType: string;
  points: number;
  joinedAt: string;
  lastActive: string;
}

const USERS_STORAGE_KEY = 'procas_team_users';

export class UserService {
  // Obtener todos los usuarios (Firebase + fallback local)
  static async getAllUsers(): Promise<StoredUser[]> {
    try {
      console.log('📡 Cargando usuarios desde Firebase...');
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.values(usersData) as StoredUser[];
        
        // Guardar backup local
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
        console.log('✅ Usuarios cargados desde Firebase:', usersList.length);
        
        return usersList;
      } else {
        console.log('📭 No hay usuarios en Firebase');
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading users from Firebase:', error);
      
      // Fallback: usar datos locales
      try {
        const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        const localUsers = usersJson ? JSON.parse(usersJson) : [];
        console.log('📱 Usando datos locales como fallback:', localUsers.length);
        return localUsers;
      } catch (localError) {
        console.error('❌ Error loading local users:', localError);
        return [];
      }
    }
  }

  // Agregar usuario (Firebase + local)
  static async addUser(user: StoredUser): Promise<void> {
    try {
      console.log('💾 Guardando usuario en Firebase:', user.name);
      const userRef = ref(database, `users/${user.id}`);
      await set(userRef, user);
      
      console.log('✅ Usuario guardado en Firebase:', user.name);
      
      // También guardar localmente como backup
      await this.addUserLocal(user);
    } catch (error) {
      console.error('❌ Error saving user to Firebase:', error);
      
      // Fallback: guardar solo localmente
      console.log('🔄 Guardando localmente como fallback...');
      await this.addUserLocal(user);
    }
  }

  // Actualizar puntos del usuario
  static async updateUserPoints(userId: string, points: number): Promise<void> {
    try {
      console.log('🔄 Actualizando puntos en Firebase:', userId, points);
      
      // Obtener usuario actual de Firebase
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const updatedUser = {
          ...userData,
          points: points,
          lastActive: new Date().toISOString()
        };
        
        await set(userRef, updatedUser);
        console.log('✅ Puntos actualizados en Firebase para:', userData.name);
      }
    } catch (error) {
      console.error('❌ Error updating points in Firebase:', error);
      
      // Fallback local
      const users = await this.getAllUsersLocal();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex >= 0) {
        users[userIndex].points = points;
        users[userIndex].lastActive = new Date().toISOString();
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log('📱 Puntos actualizados localmente');
      }
    }
  }

  // Obtener usuario específico
  static async getUser(userId: string): Promise<StoredUser | null> {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return snapshot.val() as StoredUser;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user from Firebase:', error);
      
      // Fallback local
      const users = await this.getAllUsersLocal();
      return users.find(u => u.id === userId) || null;
    }
  }

  // 🔥 TIEMPO REAL: Escuchar cambios
  static listenToUsers(callback: (users: StoredUser[]) => void): () => void {
    console.log('👂 Iniciando listener de tiempo real...');
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.values(usersData) as StoredUser[];
        
        console.log('🔄 Usuarios actualizados en TIEMPO REAL:', usersList.map(u => u.name));
        callback(usersList);
        
        // Guardar backup local
        AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
      } else {
        console.log('📭 No hay usuarios (tiempo real)');
        callback([]);
      }
    }, (error) => {
      console.error('❌ Error en listener de Firebase:', error);
    });

    return () => {
      console.log('🔇 Desconectando listener de tiempo real');
      off(usersRef, 'value', unsubscribe);
    };
  }

  // Limpiar todos los usuarios
  static async clearAllUsers(): Promise<void> {
    try {
      console.log('🗑️ Eliminando todos los usuarios...');
      const usersRef = ref(database, 'users');
      await set(usersRef, null);
      console.log('✅ Usuarios eliminados de Firebase');
      
      await AsyncStorage.removeItem(USERS_STORAGE_KEY);
      console.log('✅ Usuarios eliminados localmente');
    } catch (error) {
      console.error('❌ Error clearing users:', error);
    }
  }

  // Funciones auxiliares locales
  private static async getAllUsersLocal(): Promise<StoredUser[]> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error loading local users:', error);
      return [];
    }
  }

  private static async addUserLocal(user: StoredUser): Promise<void> {
    try {
      const users = await this.getAllUsersLocal();
      const existingUserIndex = users.findIndex(u => u.id === user.id);
      
      if (existingUserIndex >= 0) {
        users[existingUserIndex] = { ...users[existingUserIndex], ...user, lastActive: new Date().toISOString() };
      } else {
        users.push(user);
      }
      
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      console.log('💾 Usuario guardado localmente:', user.name);
    } catch (error) {
      console.error('Error saving user locally:', error);
    }
  }
}