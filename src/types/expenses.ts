import { User } from './auth';

export interface ExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type ExpensePaymentType = 'cash' | 'online';

export interface Expense {
  _id: string;
  amount: number;
  paymentType: ExpensePaymentType;
  paidBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  category: ExpenseCategory | string;
  date: string; // ISO date string
  description?: string;
  notes?: string;
  attachments?: string[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  expenseCount: number;
  paymentTypeBreakdown: Array<{
    type: string;
    amount: number;
    percentage: string;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: string;
  }>;
  userBreakdown: Array<{
    user: string;
    amount: number;
    percentage: string;
  }>;
}
