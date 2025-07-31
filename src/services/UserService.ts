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
  incompleteGoals?: number;
  firebaseKey?: string;
}

export class UserService {
  private static basePath = 'users';

  // Validar conexión a Firebase
  private static validateFirebaseConnection(): void {
    if (!database) {
      throw new Error('Firebase database no está inicializada');
    }
  }

  // Crear usuario
  static async addUser(user: StoredUser): Promise<void> {
    try {
      this.validateFirebaseConnection();
      const usersRef = ref(database, this.basePath);
      const newUserRef = push(usersRef);
      await set(newUserRef, user);
      console.log('Usuario guardado exitosamente');
    } catch (error) {
      console.error('Error guardando usuario:', error);
      throw new Error(`Error al guardar usuario: ${error.message}`);
    }
  }

  // Obtener usuario por ID
  static async getUser(userId: string): Promise<StoredUser | null> {
    try {
      this.validateFirebaseConnection();
      const usersRef = ref(database, this.basePath);
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        console.warn(`No se encontraron usuarios en la base de datos.`);
        return null;
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
        console.warn(`Usuario no encontrado: ${userId}`);
        return null;
      }
      
      return foundUser;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  // Obtener todos los usuarios
  static async getAllUsers(): Promise<StoredUser[]> {
    try {
      this.validateFirebaseConnection();
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
      this.validateFirebaseConnection();
      
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
        lastActive: new Date().toISOString()
      };
      
      await set(userRef, updatedUser);
      console.log('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error(`Error al actualizar usuario: ${error.message}`);
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
      const user = await this.getUser(userId);
      const updates: Partial<StoredUser> = { streak };
      
      // Actualizar racha más larga si es necesario
      if (!user.longestStreak || streak > user.longestStreak) {
        updates.longestStreak = streak;
      }
      
      await this.updateUser(userId, updates);
    } catch (error) {
      console.error('Error actualizando racha:', error);
      throw error;
    }
  }

  // Actualizar puntos específicos del usuario
  static async updateUserPoints(userId: string, points: number): Promise<void> {
    try {
      await this.updateUser(userId, { points });
    } catch (error) {
      console.error('Error actualizando puntos:', error);
      throw error;
    }
  }

  // Incrementar estadísticas de metas no completadas
  static async incrementIncompleteGoals(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      const currentIncomplete = user.incompleteGoals || 0;
      await this.updateUser(userId, {
        incompleteGoals: currentIncomplete + 1
      });
    } catch (error) {
      console.error('Error incrementando metas incompletas:', error);
      throw error;
    }
  }

  // Incrementar desafíos completados
  static async incrementChallengesCompleted(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      const currentChallenges = user.challengesCompleted || 0;
      await this.updateUser(userId, {
        challengesCompleted: currentChallenges + 1
      });
    } catch (error) {
      console.error('Error incrementando desafíos completados:', error);
      throw error;
    }
  }

  // Calcular y actualizar nivel del usuario basado en puntos
  static async updateUserLevel(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      const level = Math.floor(user.points / 100) + 1; // Cada 100 puntos = 1 nivel
      
      if (user.level !== level) {
        await this.updateUser(userId, { level });
        console.log(`🎉 Usuario ${user.name} subió al nivel ${level}!`);
      }
    } catch (error) {
      console.error('Error actualizando nivel:', error);
      throw error;
    }
  }

  // Obtener ranking de usuarios por puntos
  static async getUserRanking(): Promise<StoredUser[]> {
    try {
      const users = await this.getAllUsers();
      return users.sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error('Error obteniendo ranking:', error);
      return [];
    }
  }

  // Escuchar cambios en tiempo real de todos los usuarios
  static listenToUsers(callback: (users: StoredUser[]) => void): () => void {
    try {
      this.validateFirebaseConnection();
      console.log('👂 Iniciando listener de usuarios...');
      const usersRef = ref(database, this.basePath);
      
      const unsubscribe = onValue(usersRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const users: StoredUser[] = [];

            Object.keys(usersData).forEach(key => {
              const user = usersData[key] as StoredUser;
              users.push({ ...user, firebaseKey: key });
            });

            callback(users);
          } else {
            callback([]);
          }
        } catch (error) {
          console.error('Error procesando datos de usuarios:', error);
          callback([]);
        }
      }, (error) => {
        console.error('Error en listener de usuarios:', error);
        callback([]);
      });

      return () => {
        try {
          off(usersRef, 'value', unsubscribe);
        } catch (error) {
          console.error('Error desconectando listener:', error);
        }
      };
    } catch (error) {
      console.error('Error iniciando listener:', error);
      return () => {}; // Retornar función vacía si falla
    }
  }

  // Escuchar cambios de un usuario específico
  static listenToUser(userId: string, callback: (user: StoredUser | null) => void): () => void {
    try {
      this.validateFirebaseConnection();
      console.log(`👂 Iniciando listener para usuario: ${userId}`);
      const usersRef = ref(database, this.basePath);
      
      const unsubscribe = onValue(usersRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            let foundUser: StoredUser | null = null;

            Object.keys(usersData).forEach(key => {
              const user = usersData[key] as StoredUser;
              if (user.id === userId) {
                foundUser = { ...user, firebaseKey: key };
              }
            });

            callback(foundUser);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error procesando datos del usuario:', error);
          callback(null);
        }
      }, (error) => {
        console.error('Error en listener de usuario:', error);
        callback(null);
      });

      return () => {
        try {
          off(usersRef, 'value', unsubscribe);
        } catch (error) {
          console.error('Error desconectando listener:', error);
        }
      };
    } catch (error) {
      console.error('Error iniciando listener de usuario:', error);
      return () => {}; // Retornar función vacía si falla
    }
  }

  // Verificar si usuario existe
  static async userExists(userId: string): Promise<boolean> {
    try {
      await this.getUser(userId);
      return true;
    } catch {
      return false;
    }
  }

  // Obtener estadísticas generales de usuarios
  static async getUserStats(): Promise<{
    totalUsers: number;
    totalPoints: number;
    averagePoints: number;
    topUser: StoredUser | null;
  }> {
    try {
      const users = await this.getAllUsers();
      
      if (users.length === 0) {
        return {
          totalUsers: 0,
          totalPoints: 0,
          averagePoints: 0,
          topUser: null
        };
      }

      const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
      const topUser = users.reduce((top, user) => 
        user.points > top.points ? user : top
      );

      return {
        totalUsers: users.length,
        totalPoints,
        averagePoints: Math.round(totalPoints / users.length),
        topUser
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalUsers: 0,
        totalPoints: 0,
        averagePoints: 0,
        topUser: null
      };
    }
  }

  // Resetear racha de usuario
  static async resetUserStreak(userId: string): Promise<void> {
    try {
      await this.updateUser(userId, { streak: 0 });
    } catch (error) {
      console.error('Error reseteando racha:', error);
      throw error;
    }
  }
}