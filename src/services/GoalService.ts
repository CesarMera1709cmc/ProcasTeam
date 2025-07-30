import { database, ref, set, onValue, off, get, push } from './FirebaseService';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  points: number;
  isPublic: boolean;
  isCompleted: boolean;
  isIncomplete: boolean;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  incompleteAt?: string;
  firebaseKey?: string; // ✅ Agregada para almacenar la clave de Firebase
}

export class GoalService {
  private static basePath = 'goals';

  // Crear meta
  static async addGoal(goal: Goal): Promise<void> {
    try {
      const goalsRef = ref(database, this.basePath);
      const newGoalRef = push(goalsRef);
      await set(newGoalRef, goal);
      console.log('Meta guardada exitosamente');
    } catch (error) {
      console.error('Error guardando meta:', error);
      throw error;
    }
  }

  // Obtener metas por usuario
  static async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsRef = ref(database, this.basePath);
      const snapshot = await get(goalsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const goalsData = snapshot.val();
      const goals: Goal[] = [];

      Object.keys(goalsData).forEach(key => {
        const goal = goalsData[key] as Goal;
        if (goal.userId === userId) {
          goals.push({ ...goal, firebaseKey: key });
        }
      });

      // Ordenar por fecha de creación (más recientes primero)
      return goals.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error obteniendo metas:', error);
      return [];
    }
  }

  // Obtener todas las metas
  static async getAllGoals(): Promise<Goal[]> {
    try {
      const goalsRef = ref(database, this.basePath);
      const snapshot = await get(goalsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const goalsData = snapshot.val();
      const goals: Goal[] = [];

      Object.keys(goalsData).forEach(key => {
        const goal = goalsData[key] as Goal;
        goals.push({ ...goal, firebaseKey: key });
      });

      return goals.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error obteniendo todas las metas:', error);
      return [];
    }
  }

  // Actualizar meta
  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    try {
      // Encontrar la meta por goalId
      const goalsRef = ref(database, this.basePath);
      const snapshot = await get(goalsRef);
      
      if (!snapshot.exists()) {
        throw new Error('No se encontraron metas');
      }

      const goalsData = snapshot.val();
      let firebaseKey: string | null = null;

      Object.keys(goalsData).forEach(key => {
        const goal = goalsData[key] as Goal;
        if (goal.id === goalId) {
          firebaseKey = key;
        }
      });

      if (!firebaseKey) {
        throw new Error(`Meta no encontrada para actualizar: ${goalId}`);
      }

      // Remover firebaseKey de las actualizaciones ya que no debe guardarse en Firebase
      const { firebaseKey: _, ...cleanUpdates } = updates;

      // Actualizar la meta
      const goalRef = ref(database, `${this.basePath}/${firebaseKey}`);
      const currentGoal = goalsData[firebaseKey];
      const updatedGoal = { ...currentGoal, ...cleanUpdates };
      
      await set(goalRef, updatedGoal);
      console.log('Meta actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando meta:', error);
      throw error;
    }
  }

  // Completar meta
  static async completeGoal(goalId: string): Promise<void> {
    try {
      await this.updateGoal(goalId, {
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completando meta:', error);
      throw error;
    }
  }

  // Marcar meta como incompleta
  static async markGoalIncomplete(goalId: string): Promise<void> {
    try {
      await this.updateGoal(goalId, {
        isIncomplete: true,
        incompleteAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marcando meta como incompleta:', error);
      throw error;
    }
  }

  // Alternar visibilidad pública de la meta
  static async toggleGoalPublic(goalId: string, isPublic: boolean): Promise<void> {
    try {
      await this.updateGoal(goalId, { isPublic });
    } catch (error) {
      console.error('Error cambiando visibilidad de meta:', error);
      throw error;
    }
  }

  // Obtener meta por ID
  static async getGoal(goalId: string): Promise<Goal | null> {
    try {
      const goalsRef = ref(database, this.basePath);
      const snapshot = await get(goalsRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const goalsData = snapshot.val();
      let foundGoal: Goal | null = null;

      Object.keys(goalsData).forEach(key => {
        const goal = goalsData[key] as Goal;
        if (goal.id === goalId) {
          foundGoal = { ...goal, firebaseKey: key };
        }
      });

      return foundGoal;
    } catch (error) {
      console.error('Error obteniendo meta:', error);
      return null;
    }
  }

  // Obtener metas públicas de todos los usuarios
  static async getPublicGoals(): Promise<Goal[]> {
    try {
      const allGoals = await this.getAllGoals();
      return allGoals.filter(goal => goal.isPublic);
    } catch (error) {
      console.error('Error obteniendo metas públicas:', error);
      return [];
    }
  }
}