import { database, ref, set, onValue, off, get } from './FirebaseService';

export interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  frequency: 'once' | 'daily' | 'weekly';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isCompleted: boolean;
  isIncomplete: boolean;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  completedAt?: string;
  incompleteAt?: string;
  firebaseKey?: string;
}

export class GoalService {
  private static basePath = 'goals';

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

  // Método alias para compatibilidad
  static async addGoal(goal: Goal): Promise<void> {
    return this.createGoal(goal);
  }

  // Obtener todas las metas
  static async getAllGoals(): Promise<Goal[]> {
    try {
      const goalsRef = ref(database, 'goals');
      const snapshot = await get(goalsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const goalsData = snapshot.val();
      const goals: Goal[] = [];

      Object.keys(goalsData).forEach(key => {
        const goal = goalsData[key] as Goal;
        goals.push(goal);
      });

      return goals.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('❌ Error loading all goals:', error);
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
      
      if (snapshot.exists()) {
        const goal = snapshot.val() as Goal;
        const updatedGoal = {
          ...goal,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        await set(goalRef, updatedGoal);
        await this.updateUserPoints(goal.userId, goal.points);
        console.log('✅ Meta completada exitosamente');
      }
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
      
      if (snapshot.exists()) {
        const goal = snapshot.val() as Goal;
        const updatedGoal = {
          ...goal,
          isIncomplete: true,
          incompleteAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        await set(goalRef, updatedGoal);
        await this.updateUserIncompleteStats(goal.userId);
        console.log('📉 Meta marcada como no completada');
      }
    } catch (error) {
      console.error('❌ Error marking goal as incomplete:', error);
      throw error;
    }
  }

  // Actualizar puntos del usuario (helper method)
  private static async updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
    try {
      console.log(`🎯 Agregando ${pointsToAdd} puntos al usuario ${userId}`);
      const userRef = ref(database, `users/${userId}/points`);
      const snapshot = await get(userRef);
      const currentPoints = snapshot.exists() ? snapshot.val() : 0;
      await set(userRef, currentPoints + pointsToAdd);
    } catch (error) {
      console.error('❌ Error updating user points:', error);
    }
  }

  // Actualizar estadísticas de metas no completadas del usuario
  private static async updateUserIncompleteStats(userId: string): Promise<void> {
    try {
      console.log(`📊 Actualizando estadísticas de metas no completadas para usuario ${userId}`);
      const userStatsRef = ref(database, `users/${userId}/incompleteGoals`);
      const snapshot = await get(userStatsRef);
      const currentIncomplete = snapshot.exists() ? snapshot.val() : 0;
      await set(userStatsRef, currentIncomplete + 1);
    } catch (error) {
      console.error('❌ Error updating incomplete stats:', error);
    }
  }

  // Escuchar cambios en metas en tiempo real
  static listenToGoals(callback: (goals: Goal[]) => void): () => void {
    console.log('👂 Iniciando listener de metas...');
    const goalsRef = ref(database, 'goals');
    
    const unsubscribe = onValue(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const goalsData = snapshot.val();
        const goals: Goal[] = Object.values(goalsData);
        callback(goals);
      } else {
        callback([]);
      }
    });

    return () => off(goalsRef, 'value', unsubscribe);
  }

  // Obtener metas del día actual para un usuario
  static async getTodayGoals(userId: string): Promise<Goal[]> {
    try {
      const userGoals = await this.getUserGoals(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return userGoals.filter(goal => {
        const dueDate = new Date(goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() || goal.frequency === 'daily';
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

  // Actualizar meta
  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    try {
      const goalRef = ref(database, `goals/${goalId}`);
      const snapshot = await get(goalRef);
      
      if (!snapshot.exists()) {
        throw new Error(`Meta no encontrada: ${goalId}`);
      }

      const currentGoal = snapshot.val() as Goal;
      const updatedGoal = { 
        ...currentGoal, 
        ...updates, 
        lastUpdated: new Date().toISOString() 
      };
      
      await set(goalRef, updatedGoal);
      console.log('✅ Meta actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error updating goal:', error);
      throw error;
    }
  }

  // Obtener meta por ID
  static async getGoal(goalId: string): Promise<Goal | null> {
    try {
      const goalRef = ref(database, `goals/${goalId}`);
      const snapshot = await get(goalRef);
      
      return snapshot.exists() ? snapshot.val() as Goal : null;
    } catch (error) {
      console.error('❌ Error getting goal:', error);
      return null;
    }
  }

  // Alternar visibilidad pública de la meta
  static async toggleGoalPublic(goalId: string, isPublic: boolean): Promise<void> {
    try {
      await this.updateGoal(goalId, { isPublic });
    } catch (error) {
      console.error('❌ Error changing goal visibility:', error);
      throw error;
    }
  }
}