// Tipos de navegación
export type RootStackParamList = {
  Home: undefined;
  UserInput: { userType: string };
  Dashboard: { userId?: string; userName?: string }; // Pasar parámetros al contenedor de tabs
  CreateGoal: { userId: string; userName: string };
  Team: { currentUserId: string };
};

// Tipos para las tabs dentro de Dashboard
export type TabParamList = {
  DashboardTab: { userId?: string; userName?: string };
  PublicCommitmentsTab: { userId?: string; userName?: string };
  ProfileTab: { userId?: string; userName?: string };
};

// Tipos de usuario
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  tasks: Task[];
}

// Tipos de tareas
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  userId: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Tipos de equipo
export interface Team {
  id: string;
  name: string;
  description: string;
  members: User[];
  tasks: Task[];
  createdAt: Date;
}

// Props de componentes
export interface HomeScreenProps {
  navigation: any;
  onSelectUser?: (userName: string) => void;
}

// Estados de la aplicación
export interface AppState {
  currentUser: User | null;
  selectedTeam: Team | null;
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

// Tipos de eventos/acciones
export type UserAction = 
  | { type: 'SELECT_USER'; payload: string }
  | { type: 'CREATE_TASK'; payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string };