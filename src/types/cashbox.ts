import { User } from './auth';

export interface CashSessionType {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashSession {
  _id: string;
  date: string; // ISO
  sessionName: string; // e.g., "Morning", "Afternoon", "Evening"
  openedBy: User | string;
  closedBy?: User | string;
  openingAmount: number;
  closingAmount?: number;
  notes?: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashSummary {
  net: number;
  sessionCount: number;
  sessionBreakdown: SessionBreakdown[];
}

export interface SessionBreakdown {
  sessionName: string;
  totalNet: number;
  sessionCount: number;
  sessions: SessionSummary[];
}

export interface SessionSummary {
  sessionId: string;
  sessionName: string;
  date: string;
  status: string;
  openingAmount: number;
  closingAmount: number;
  net: number;
}
