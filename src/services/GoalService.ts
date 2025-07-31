import { database, ref, set, onValue, off, get } from './FirebaseService';
import { UserService } from './UserService';

export interface Bet {
  userId: string;
  betType: 'for' | 'against';
  amount: number;
}

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
  evidenceUrl?: string | null;
  bets?: Bet[];
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

  // Marcar meta pública como completada (con bonus y distribución de apuestas)
  static async completePublicGoal(goalId: string, evidenceUrl: string): Promise<void> {
    try {
      console.log(`🏆 Completando meta pública: ${goalId}`);
      const goalRef = ref(database, `goals/${goalId}`);
      const snapshot = await get(goalRef);
      
      if (snapshot.exists()) {
        const goal = snapshot.val() as Goal;
        const updatedGoal = {
          ...goal,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          evidenceUrl: evidenceUrl,
          lastUpdated: new Date().toISOString()
        };
        
        await set(goalRef, updatedGoal);

        // Otorgar puntos al creador (con bonus del 50%)
        const bonusPoints = Math.ceil(goal.points * 0.5);
        const totalPointsForCreator = goal.points + bonusPoints;
        await this.updateUserPoints(goal.userId, totalPointsForCreator);
        console.log(`✅ Meta pública completada. Creador gana ${totalPointsForCreator} puntos.`);

        // TODO: Distribuir puntos de apuestas
        if (goal.bets) {
          for (const bet of goal.bets) {
            if (bet.betType === 'for') {
              // Ganaron, devuelves lo apostado x2
              await this.updateUserPoints(bet.userId, bet.amount * 2);
            }
            // Si apostaron 'against', ya perdieron sus puntos al apostar.
          }
        }
      }
    } catch (error) {
      console.error('❌ Error completing public goal:', error);
      throw error;
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

  // Añadir una apuesta a una meta
  static async addBetToGoal(goalId: string, bet: Bet): Promise<void> {
    try {
      const goalRef = ref(database, `goals/${goalId}`);
      const goalSnapshot = await get(goalRef);

      if (!goalSnapshot.exists()) {
        throw new Error('La meta no existe.');
      }

      const goal = goalSnapshot.val() as Goal;

      // Validar que el usuario tenga suficientes puntos
      const user = await UserService.getUser(bet.userId);
      if (!user || user.points < bet.amount) {
        throw new Error('No tienes suficientes puntos para apostar.');
      }

      // Deducir puntos del apostador
      await this.updateUserPoints(bet.userId, -bet.amount);

      // Añadir la apuesta a la meta
      const bets = goal.bets || [];
      bets.push(bet);
      await set(ref(database, `goals/${goalId}/bets`), bets);

      console.log(`💸 Apuesta de ${bet.amount} pts registrada para ${bet.userId} en la meta ${goalId}`);
    } catch (error) {
      console.error('❌ Error adding bet to goal:', error);
      throw error;
    }
  }

  // Marcar meta como no completada
  static async markGoalAsIncomplete(goalId: string): Promise<void> {
    try {
      console.log(`📉 Marcando meta como no completada: ${goalId}`);
      const goalRef = ref(database, `goals/${goalId}`);
      const snapshot = await get(goalRef);
      
      if (snapshot.exists()) {
        const goal = snapshot.val() as Goal;

        // Si es una meta pública, tiene una lógica de fallo diferente
        if (goal.isPublic) {
          await this.failPublicGoal(goalId);
          return;
        }

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

  // Marcar meta pública como fallida y distribuir puntos
  static async failPublicGoal(goalId: string): Promise<void> {
    try {
      console.log(`💥 Fallando meta pública: ${goalId}`);
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

        // Deducir puntos del creador
        await this.updateUserPoints(goal.userId, -goal.points);
        console.log(`💥 Meta pública fallida. Creador pierde ${goal.points} puntos.`);

        // Distribuir puntos de apuestas
        if (goal.bets) {
          for (const bet of goal.bets) {
            if (bet.betType === 'against') {
              // Ganaron, devuelves lo apostado x2
              await this.updateUserPoints(bet.userId, bet.amount * 2);
            }
            // Si apostaron 'for', ya perdieron sus puntos al apostar.
          }
        }
      }
    } catch (error) {
      console.error('❌ Error failing public goal:', error);
      throw error;
    }
  }

  // Actualizar puntos del usuario (helper method)
  private static async updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
    try {
      console.log(`🎯 Buscando usuario ${userId} para agregar ${pointsToAdd} puntos`);
      
      // Buscar el usuario usando UserService que maneja correctamente los Firebase keys
      const user = await UserService.getUser(userId);
      
      if (!user) {
        console.error(`❌ Usuario no encontrado: ${userId}`);
        return;
      }
      
      const currentPoints = user.points || 0;
      const newPoints = Math.max(0, currentPoints + pointsToAdd);
      
      // Usar UserService para actualizar, que maneja correctamente los Firebase keys
      await UserService.updateUser(userId, {
        points: newPoints,
        lastActive: new Date().toISOString()
      });
      
      console.log(`✅ Puntos actualizados para ${user.name}: ${currentPoints} → ${newPoints}`);
    } catch (error) {
      console.error('❌ Error updating user points:', error);
      throw error;
    }
  }

  // Actualizar estadísticas de metas no completadas del usuario
  private static async updateUserIncompleteStats(userId: string): Promise<void> {
    try {
      console.log(`📊 Actualizando estadísticas de metas no completadas para usuario ${userId}`);
      
      // Usar UserService para manejar la actualización correctamente
      await UserService.incrementIncompleteGoals(userId);
      
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

  // Escuchar cambios solo en metas públicas
  static listenToPublicGoals(callback: (goals: Goal[]) => void): () => void {
    console.log('👂 Iniciando listener de metas públicas...');
    const goalsRef = ref(database, 'goals');
    
    const unsubscribe = onValue(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const goalsData = snapshot.val();
        const allGoals: Goal[] = Object.values(goalsData);
        const publicGoals = allGoals.filter(g => g.isPublic);
        callback(publicGoals);
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