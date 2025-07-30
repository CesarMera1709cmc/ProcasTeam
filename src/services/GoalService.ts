import { database, ref, set, onValue, off, get } from './FirebaseService';

export interface Goal {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  dueDate: string;
  frequency: 'once' | 'daily' | 'weekly';
  isPublic: boolean;
  isCompleted: boolean;
  isIncomplete?: boolean; // Nuevo campo
  createdAt: string;
  lastUpdated: string;
  completedAt?: string;
  incompleteAt?: string; // Nuevo campo
}

export class GoalService {
  // Crear una nueva meta
  static async createGoal(goal: Goal): Promise<void> {
    try {
      console.log('💾 Guardando meta en Firebase:', goal.title);
      const goalRef = ref(database, `goals/${goal.id}`);
      await set(goalRef, goal);
      console.log('✅ Meta guardada en Firebase:', goal.title);
    } catch (error) {
      console.error('❌ Error saving goal to Firebase:', error);
      throw error;
    }
  }

  // Obtener todas las metas
  static async getAllGoals(): Promise<Goal[]> {
    try {
      const goalsRef = ref(database, 'goals');
      const snapshot = await get(goalsRef);
      
      if (snapshot.exists()) {
        const goalsData = snapshot.val();
        return Object.values(goalsData) as Goal[];
      }
      return [];
    } catch (error) {
      console.error('❌ Error loading goals from Firebase:', error);
      return [];
    }
  }

  // Obtener metas de un usuario específico
  static async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const allGoals = await this.getAllGoals();
      return allGoals.filter(goal => goal.userId === userId);
    } catch (error) {
      console.error('❌ Error loading user goals:', error);
      return [];
    }
  }

  // Obtener metas públicas de todos los usuarios
  static async getPublicGoals(): Promise<Goal[]> {
    try {
      const allGoals = await this.getAllGoals();
      return allGoals.filter(goal => goal.isPublic);
    } catch (error) {
      console.error('❌ Error loading public goals:', error);
      return [];
    }
  }

  // Marcar meta como completada y actualizar puntos del usuario
  static async completeGoal(goalId: string): Promise<void> {
    try {
      console.log(`🎯 Completando meta: ${goalId}`);
      
      const goalRef = ref(database, `goals/${goalId}`);
      const snapshot = await get(goalRef);
      
      if (!snapshot.exists()) {
        throw new Error('Meta no encontrada');
      }

      const goalData = snapshot.val();
      
      if (goalData.isCompleted) {
        console.log('⚠️ Meta ya estaba completada');
        return;
      }

      // Actualizar la meta como completada
      const updatedGoal = {
        ...goalData,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      
      await set(goalRef, updatedGoal);
      console.log(`✅ Meta completada en Firebase: ${goalData.title}`);

      // Actualizar puntos del usuario
      await this.updateUserPoints(goalData.userId, goalData.points);
      
    } catch (error) {
      console.error('❌ Error completing goal:', error);
      throw error;
    }
  }

  // Marcar meta como no completada (para prototipo)
  static async markGoalAsIncomplete(goalId: string): Promise<void> {
    try {
      console.log(`📉 Marcando meta como no completada: ${goalId}`);
      
      const goalRef = ref(database, `goals/${goalId}`);
      const snapshot = await get(goalRef);
      
      if (!snapshot.exists()) {
        throw new Error('Meta no encontrada');
      }

      const goalData = snapshot.val();
      
      if (!goalData.isCompleted) {
        console.log('⚠️ La meta ya estaba como no completada');
        return;
      }

      // Actualizar la meta como no completada
      const updatedGoal = {
        ...goalData,
        isCompleted: false,
        lastUpdated: new Date().toISOString(),
      };
      
      await set(goalRef, updatedGoal);
      console.log(`📉 Meta marcada como no completada: ${goalData.title}`);

      // Actualizar estadísticas del usuario (opcional)
      await this.updateUserIncompleteStats(goalData.userId);
      
    } catch (error) {
      console.error('❌ Error marking goal as incomplete:', error);
      throw error;
    }
  }

  // Actualizar puntos del usuario (helper method)
  private static async updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
    try {
      console.log(`🎯 Agregando ${pointsToAdd} puntos al usuario ${userId}`);
      
      // Obtener usuario actual
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = snapshot.val();
      const newPoints = userData.points + pointsToAdd;
      
      // Actualizar puntos en Firebase
      const updatedUser = {
        ...userData,
        points: newPoints,
        lastUpdated: new Date().toISOString(),
      };
      
      await set(userRef, updatedUser);
      console.log(`✅ Puntos actualizados: ${userData.name} ahora tiene ${newPoints} puntos`);
      
    } catch (error) {
      console.error('❌ Error updating user points:', error);
      throw error;
    }
  }

  // Actualizar estadísticas de metas no completadas del usuario
  private static async updateUserIncompleteStats(userId: string): Promise<void> {
    try {
      console.log(`📊 Actualizando estadísticas de metas no completadas para usuario ${userId}`);
      
      // Obtener usuario actual
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = snapshot.val();
      const incompleteGoals = (userData.incompleteGoals || 0) + 1;
      
      // Actualizar estadísticas en Firebase
      const updatedUser = {
        ...userData,
        incompleteGoals,
        lastUpdated: new Date().toISOString(),
      };
      
      await set(userRef, updatedUser);
      console.log(`📊 Estadísticas actualizadas: ${userData.name} tiene ${incompleteGoals} metas no completadas`);
      
    } catch (error) {
      console.error('❌ Error updating incomplete stats:', error);
      // No lanzar error aquí para no afectar la funcionalidad principal
    }
  }

  // Escuchar cambios en metas en tiempo real
  static listenToGoals(callback: (goals: Goal[]) => void): () => void {
    console.log('👂 Iniciando listener de metas...');
    const goalsRef = ref(database, 'goals');
    
    const unsubscribe = onValue(goalsRef, (snapshot) => {
      console.log('🔥 Firebase snapshot recibido para goals');
      
      if (snapshot.exists()) {
        const goalsData = snapshot.val();
        console.log('📋 Datos raw de Firebase:', goalsData);
        
        const goalsList = Object.values(goalsData) as Goal[];
        console.log('📋 Metas convertidas a array:', goalsList.length);
        goalsList.forEach(goal => {
          console.log(`📋 Meta: ${goal.title} - UserId: ${goal.userId} - Fecha: ${goal.dueDate}`);
        });
        
        callback(goalsList);
      } else {
        console.log('📭 No hay metas en Firebase');
        callback([]);
      }
    }, (error) => {
      console.error('❌ Error en listener de metas:', error);
    });

    return () => {
      console.log('🔇 Desconectando listener de metas');
      off(goalsRef, 'value', unsubscribe);
    };
  }

  // Obtener metas del día actual para un usuario
  static async getTodayGoals(userId: string): Promise<Goal[]> {
    try {
      const userGoals = await this.getUserGoals(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return userGoals.filter(goal => {
        const goalDate = new Date(goal.dueDate);
        goalDate.setHours(0, 0, 0, 0);
        return goalDate.getTime() === today.getTime();
      });
    } catch (error) {
      console.error('❌ Error loading today goals:', error);
      return [];
    }
  }

  // Eliminar meta
  static async deleteGoal(goalId: string): Promise<void> {
    try {
      const goalRef = ref(database, `goals/${goalId}`);
      await set(goalRef, null);
      console.log('🗑️ Meta eliminada:', goalId);
    } catch (error) {
      console.error('❌ Error deleting goal:', error);
      throw error;
    }
  }
}