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