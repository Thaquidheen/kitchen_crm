/**
 * Payment-related types and interfaces
 * Based on backend Payment entity and DTOs
 */

export const PaymentMethod = {
  CASH: 'CASH',
  ACCOUNT_TRANSFER: 'ACCOUNT_TRANSFER',
  CHEQUE: 'CHEQUE',
  CARD: 'CARD',
  UPI: 'UPI',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface Payment {
  id: number;
  projectId: number;
  projectName: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  receivedBy: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreateRequest {
  projectId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentUpdateRequest {
  id: number;
  projectId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  paymentStatus: PaymentStatus;
}

export interface PaymentSummary {
  id: number;
  projectId: number;
  projectName: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  paymentStatus: PaymentStatus;
  receivedBy: string;
}

export interface ProjectPaymentSummary {
  projectId: number;
  projectName: string;
  customerName: string;
  totalAmount: number;
  totalPaidAmount: number;
  remainingBalance: number;
  paymentCount: number;
  lastPaymentDate?: string;
  payments: PaymentSummary[];
}

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  averagePaymentAmount: number;
  paymentsByMethod: Record<PaymentMethod, number>;
  paymentsByStatus: Record<PaymentStatus, number>;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
}

export interface PaymentFilters {
  projectId?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
  customerName?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentFormData {
  projectId: number;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
}

export interface PaymentFormErrors {
  projectId?: string;
  amount?: string;
  paymentMethod?: string;
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
}

// Helper types for payment method display
export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  requiresReference: boolean;
}

export interface PaymentStatusOption {
  value: PaymentStatus;
  label: string;
  color: string;
}

// API response types
export interface PaymentApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaymentListResponse {
  content: PaymentSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
