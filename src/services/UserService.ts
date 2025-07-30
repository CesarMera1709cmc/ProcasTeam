import { database, ref, set, onValue, off, get, push } from './FirebaseService';

export interface StoredUser {
  id: string;
  name: string;
  userType: string;
  points: number;
  streak: number;
  joinedAt: string;
  lastActive: string;
  level?: number;
  longestStreak?: number;
  challengesCompleted?: number;
  firebaseKey?: string; // ✅ Agregada para almacenar la clave de Firebase
}

export class UserService {
  private static basePath = 'users';

  // Crear usuario
  static async addUser(user: StoredUser): Promise<void> {
    try {
      const usersRef = ref(database, this.basePath);
      const newUserRef = push(usersRef);
      await set(newUserRef, user);
      console.log('Usuario guardado exitosamente');
    } catch (error) {
      console.error('Error guardando usuario:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  static async getUser(userId: string): Promise<StoredUser> {
    try {
      const usersRef = ref(database, this.basePath);
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        throw new Error(`Usuario no encontrado: ${userId}`);
      }

      const usersData = snapshot.val();
      let foundUser: StoredUser | null = null;

      Object.keys(usersData).forEach(key => {
        const user = usersData[key] as StoredUser;
        if (user.id === userId) {
          foundUser = { ...user, firebaseKey: key };
        }
      });

      if (!foundUser) {
        throw new Error(`Usuario no encontrado: ${userId}`);
      }
      
      return foundUser;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async getAllUsers(): Promise<StoredUser[]> {
    try {
      const usersRef = ref(database, this.basePath);
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const usersData = snapshot.val();
      const users: StoredUser[] = [];

      Object.keys(usersData).forEach(key => {
        const user = usersData[key] as StoredUser;
        users.push({ ...user, firebaseKey: key });
      });

      return users;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return [];
    }
  }

  // Actualizar usuario
  static async updateUser(userId: string, updates: Partial<StoredUser>): Promise<void> {
    try {
      // Encontrar el usuario por userId
      const usersRef = ref(database, this.basePath);
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        throw new Error('No se encontraron usuarios');
      }

      const usersData = snapshot.val();
      let firebaseKey: string | null = null;

      Object.keys(usersData).forEach(key => {
        const user = usersData[key] as StoredUser;
        if (user.id === userId) {
          firebaseKey = key;
        }
      });

      if (!firebaseKey) {
        throw new Error(`Usuario no encontrado para actualizar: ${userId}`);
      }

      // Remover firebaseKey de las actualizaciones ya que no debe guardarse en Firebase
      const { firebaseKey: _, ...cleanUpdates } = updates;

      // Actualizar el usuario
      const userRef = ref(database, `${this.basePath}/${firebaseKey}`);
      const currentUser = usersData[firebaseKey];
      const updatedUser = { 
        ...currentUser, 
        ...cleanUpdates,
        lastActive: new Date().toISOString() // Siempre actualizar lastActive
      };
      
      await set(userRef, updatedUser);
      console.log('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  // Incrementar puntos del usuario
  static async addPointsToUser(userId: string, points: number): Promise<void> {
    try {
      const user = await this.getUser(userId);
      await this.updateUser(userId, {
        points: user.points + points
      });
    } catch (error) {
      console.error('Error agregando puntos:', error);
      throw error;
    }
  }

  // Actualizar racha del usuario
  static async updateUserStreak(userId: string, streak: number): Promise<void> {
    try {
      await this.updateUser(userId, {
        streak
      });
    } catch (error) {
      console.error('Error actualizando racha:', error);
      throw error;
    }
  }
}