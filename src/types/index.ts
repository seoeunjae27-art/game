export type TaskCategory = 'work' | 'study' | 'personal' | 'health';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  subtasks: SubTask[];
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  category: TaskCategory;
  streak: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD': boolean
  targetDaysPerWeek: number;
  reminderTime?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: TaskCategory;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
}

export type FocusMode = 'focus' | 'short_break' | 'long_break';

export interface SoundState {
  id: 'rain' | 'campfire' | 'whitenoise' | 'cafe' | 'waves';
  name: string;
  icon: string;
  playing: boolean;
  volume: number; // 0.0 to 1.0
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
