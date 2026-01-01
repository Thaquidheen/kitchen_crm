/**
 * Payment utility functions and constants
 */

import {
  PaymentMethod,
  PaymentStatus,
} from '../types';
import type {
  PaymentMethodOption,
  PaymentStatusOption,
} from '../types';

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    value: PaymentMethod.CASH,
    label: 'Cash',
    description: 'Cash payment',
    requiresReference: false,
  },
  {
    value: PaymentMethod.ACCOUNT_TRANSFER,
    label: 'Account Transfer',
    description: 'Direct bank transfer',
    requiresReference: true,
  },
  {
    value: PaymentMethod.CHEQUE,
    label: 'Cheque',
    description: 'Cheque payment',
    requiresReference: true,
  },
  {
    value: PaymentMethod.CARD,
    label: 'Card',
    description: 'Credit/Debit card',
    requiresReference: false,
  },
  {
    value: PaymentMethod.UPI,
    label: 'UPI',
    description: 'UPI payment',
    requiresReference: false,
  },
  {
    value: PaymentMethod.NEFT,
    label: 'NEFT',
    description: 'National Electronic Funds Transfer',
    requiresReference: true,
  },
  {
    value: PaymentMethod.RTGS,
    label: 'RTGS',
    description: 'Real Time Gross Settlement',
    requiresReference: true,
  },
];

export const PAYMENT_STATUS_OPTIONS: PaymentStatusOption[] = [
  {
    value: PaymentStatus.PENDING,
    label: 'Pending',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
  },
  {
    value: PaymentStatus.COMPLETED,
    label: 'Completed',
    color: 'bg-green-500/20 text-green-400 border-green-500',
  },
  {
    value: PaymentStatus.FAILED,
    label: 'Failed',
    color: 'bg-red-500/20 text-red-400 border-red-500',
  },
  {
    value: PaymentStatus.REFUNDED,
    label: 'Refunded',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500',
  },
];

export const PAYMENT_FORMATTERS = {
  currency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  },

  date: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  },

  dateTime: (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  paymentMethod: (method: PaymentMethod): string => {
    const option = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method);
    return option?.label || method;
  },

  paymentStatus: (status: PaymentStatus): string => {
    const option = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  },
};

export const PAYMENT_CONSTANTS = {
  MAX_NOTES_LENGTH: 500,
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 99999999,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  REFERENCE_NUMBER_LENGTHS: {
    CHEQUE: { min: 6, max: 10 },
    NEFT: { min: 8, max: 20 },
    RTGS: { min: 8, max: 20 },
    ACCOUNT_TRANSFER: { min: 6, max: 20 },
  },
};

export const PAYMENT_VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: {
    PROJECT_ID: 'Project is required',
    AMOUNT: 'Payment amount is required',
    PAYMENT_METHOD: 'Payment method is required',
    PAYMENT_DATE: 'Payment date is required',
    REFERENCE_NUMBER: 'Reference number is required for this payment method',
  },
  INVALID_FORMAT: {
    AMOUNT: 'Payment amount must be a positive number',
    PAYMENT_DATE: 'Payment date cannot be in the future',
    REFERENCE_NUMBER: 'Invalid reference number format',
    NOTES_LENGTH: 'Notes cannot exceed 500 characters',
  },
  BALANCE_CHECKS: {
    EXCEEDS_BALANCE: 'Payment amount exceeds remaining balance',
    EXCEEDS_TOTAL: 'Payment amount exceeds total project amount',
    ZERO_AMOUNT: 'Payment amount must be greater than zero',
  },
};

export const PAYMENT_SORT_OPTIONS = [
  { value: 'paymentDate', label: 'Payment Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'paymentMethod', label: 'Payment Method' },
  { value: 'paymentStatus', label: 'Status' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'projectName', label: 'Project Name' },
];

export const PAYMENT_FILTER_OPTIONS = {
  paymentMethods: PAYMENT_METHOD_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
  paymentStatuses: PAYMENT_STATUS_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
};

/**
 * Utility functions for payment operations
 */
export class PaymentUtils {
  /**
   * Generates a unique payment reference number
   */
  static generateReferenceNumber(paymentMethod: PaymentMethod): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    switch (paymentMethod) {
      case PaymentMethod.CHEQUE:
        return `CHQ${timestamp.slice(-6)}`;
      case PaymentMethod.NEFT:
        return `NEFT${random}`;
      case PaymentMethod.RTGS:
        return `RTGS${random}`;
      case PaymentMethod.ACCOUNT_TRANSFER:
        return `TRF${random}`;
      default:
        return `REF${timestamp.slice(-8)}`;
    }
  }

  /**
   * Calculates payment summary statistics
   */
  static calculatePaymentStatistics(payments: any[]) {
    if (payments.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        averageAmount: 0,
        paymentsByMethod: {},
        paymentsByStatus: {},
      };
    }

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCount = payments.length;
    const averageAmount = totalAmount / totalCount;

    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<PaymentMethod, number>);

    const paymentsByStatus = payments.reduce((acc, payment) => {
      acc[payment.paymentStatus] = (acc[payment.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<PaymentStatus, number>);

    return {
      totalAmount,
      totalCount,
      averageAmount,
      paymentsByMethod,
      paymentsByStatus,
    };
  }

  /**
   * Formats payment amount with currency
   */
  static formatAmount(amount: number): string {
    return PAYMENT_FORMATTERS.currency(amount);
  }

  /**
   * Gets payment method display info
   */
  static getPaymentMethodInfo(method: PaymentMethod): PaymentMethodOption | undefined {
    return PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method);
  }

  /**
   * Gets payment status display info
   */
  static getPaymentStatusInfo(status: PaymentStatus): PaymentStatusOption | undefined {
    return PAYMENT_STATUS_OPTIONS.find(opt => opt.value === status);
  }

  /**
   * Checks if payment method requires reference number
   */
  static requiresReferenceNumber(method: PaymentMethod): boolean {
    const info = this.getPaymentMethodInfo(method);
    return info?.requiresReference || false;
  }

  /**
   * Validates payment amount format
   */
  static isValidAmount(amount: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= PAYMENT_CONSTANTS.MAX_AMOUNT;
  }

  /**
   * Converts amount string to number
   */
  static parseAmount(amount: string): number {
    return parseFloat(amount) || 0;
  }

  /**
   * Formats amount for input field
   */
  static formatAmountForInput(amount: number): string {
    return amount.toString();
  }
}
