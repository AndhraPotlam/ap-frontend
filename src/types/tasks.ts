import { User } from './auth';

export interface Task {
  _id: string;
  title: string;
  description: string;
  taskFor: 'hotel' | 'restaurant' | 'maintenance' | 'cleaning' | 'security' | 'guest_services' | 'other';
  taskOwner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startTime?: string;
  endTime?: string;
  timeTaken?: number;
  procedure?: string;
  checklistType: 'daily' | 'weekly' | 'monthly' | 'custom';
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  attachments?: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  parentTask?: {
    _id: string;
    title: string;
  };
  subtasks?: Task[];
  tags?: string[];
  location?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplate {
  _id: string;
  name: string;
  description: string;
  taskFor: 'hotel' | 'restaurant' | 'maintenance' | 'cleaning' | 'security' | 'guest_services' | 'other';
  procedure: string;
  checklistType: 'daily' | 'weekly' | 'monthly' | 'custom';
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  location?: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: string;
  instructions: string[];
  requiredSkills?: string[];
  equipment?: string[];
  safetyNotes?: string;
  defaultAssignees?: string[] | User[];
  defaultDueTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  overview: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    onHold: number;
    avgTimeTaken: number;
    totalTimeTaken: number;
  };
  checklistBreakdown: Array<{
    _id: string;
    count: number;
  }>;
}

export type TaskType = 'cooking' | 'cutting' | 'preparing' | 'cleaning' | 'mixing' | 'removing' | 'soaking' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface StepTaskTemplate {
  _id?: string;
  name: string;
  description?: string;
  type: TaskType;
  procedure?: string;
  priority: TaskPriority;
  itemsUsed?: string[];
  defaultAssignees?: string[]; // user ids
  timeWindow: { startOffsetMin: number; durationMin: number };
  taskFor?: string[];
  tags?: string[];
  location?: string;
  acceptanceCriteria?: string;
  quantity?: number;
  unit?: string;
  requiredSkills?: string[];
  equipment?: string[];
  safetyNotes?: string;
  qaChecks?: string[];
  canRunInParallel?: boolean;
  blocking?: boolean;
  dependsOn?: number[];
}
