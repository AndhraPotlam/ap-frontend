export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'employee';
  isActive?: boolean;
  department?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  employeeId?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  address?: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attendance {
  _id: string;
  employee: string | User;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  workingHours?: number;
  breakDuration?: number;
  overtimeHours?: number;
  lateMinutes?: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  leaveType?: 'sick' | 'casual' | 'vacation';
  notes?: string;
  shiftAssignment?: string;
  breaks?: Array<{
    _id?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    type?: 'lunch' | 'tea' | 'other';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  daysOfWeek: number[];
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignment {
  _id: string;
  employee: string | User;
  shift: string | Shift;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'swapped';
  notes?: string;
  assignedBy: string | User;
  swappedWith?: string | User;
  createdAt: string;
  updatedAt: string;
}
