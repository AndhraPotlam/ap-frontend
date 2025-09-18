export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: Category | string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
  priceAtOrder: number;
}

export interface AppliedCoupon {
  couponId: string;
  code: string;
  discountAmount: number;
}

export interface AutomaticDiscount {
  discount: {
    _id: string;
    name: string;
    type: string;
    value: number;
  };
  discountAmount: number;
}

export interface OrderPricing {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  discountCode: string;
  totalAmount: number;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  shippingDetails: {
    type: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentDetails: {
    method: string;
    status: string;
  };
  pricing: OrderPricing;
  appliedCoupon?: AppliedCoupon;
  automaticDiscounts?: AutomaticDiscount[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled';
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Task Management Types
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

// Expense Management Types
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