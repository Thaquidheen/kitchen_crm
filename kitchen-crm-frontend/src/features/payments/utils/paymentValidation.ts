/**
 * Payment validation utilities
 * Handles validation logic including balance checks
 */

import {
  PaymentMethod,
} from '../types';
import type {
  PaymentFormData,
  PaymentFormErrors,
  PaymentValidationResult,
  ProjectPaymentSummary,
} from '../types';

export class PaymentValidator {
  /**
   * Validates payment form data
   */
  static validatePaymentForm(
    formData: PaymentFormData,
    projectSummary?: ProjectPaymentSummary
  ): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validations
    if (!formData.projectId || formData.projectId <= 0) {
      errors.push('Project is required');
    }

    if (!formData.amount || formData.amount.trim() === '') {
      errors.push('Payment amount is required');
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Payment amount must be a positive number');
      } else {
        // Check if amount exceeds remaining balance
        if (projectSummary && amount > projectSummary.remainingBalance) {
          errors.push(
            `Payment amount (₹${amount.toLocaleString()}) exceeds remaining balance (₹${projectSummary.remainingBalance.toLocaleString()})`
          );
        }
      }
    }

    if (!formData.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (!formData.paymentDate) {
      errors.push('Payment date is required');
    } else {
      const paymentDate = new Date(formData.paymentDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (paymentDate > today) {
        errors.push('Payment date cannot be in the future');
      }

      // Check if payment date is too far in the past (more than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (paymentDate < oneYearAgo) {
        warnings.push('Payment date is more than 1 year ago');
      }
    }

    // Payment method specific validations
    if (formData.paymentMethod && this.requiresReferenceNumber(formData.paymentMethod)) {
      if (!formData.referenceNumber || formData.referenceNumber.trim() === '') {
        errors.push('Reference number is required for this payment method');
      } else {
        // Validate reference number format
        if (!this.isValidReferenceNumber(formData.referenceNumber, formData.paymentMethod)) {
          errors.push('Invalid reference number format');
        }
      }
    }

    // Notes validation
    if (formData.notes && formData.notes.length > 500) {
      errors.push('Notes cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates payment form and returns field-specific errors
   */
  static validatePaymentFormFields(
    formData: PaymentFormData,
    projectSummary?: ProjectPaymentSummary
  ): PaymentFormErrors {
    const errors: PaymentFormErrors = {};

    if (!formData.projectId || formData.projectId <= 0) {
      errors.projectId = 'Project is required';
    }

    if (!formData.amount || formData.amount.trim() === '') {
      errors.amount = 'Payment amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Payment amount must be a positive number';
      } else if (projectSummary && amount > projectSummary.remainingBalance) {
        errors.amount = `Amount exceeds remaining balance (₹${projectSummary.remainingBalance.toLocaleString()})`;
      }
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }

    if (!formData.paymentDate) {
      errors.paymentDate = 'Payment date is required';
    } else {
      const paymentDate = new Date(formData.paymentDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (paymentDate > today) {
        errors.paymentDate = 'Payment date cannot be in the future';
      }
    }

    if (formData.paymentMethod && this.requiresReferenceNumber(formData.paymentMethod)) {
      if (!formData.referenceNumber || formData.referenceNumber.trim() === '') {
        errors.referenceNumber = 'Reference number is required for this payment method';
      } else if (!this.isValidReferenceNumber(formData.referenceNumber, formData.paymentMethod)) {
        errors.referenceNumber = 'Invalid reference number format';
      }
    }

    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Notes cannot exceed 500 characters';
    }

    return errors;
  }

  /**
   * Checks if payment method requires reference number
   */
  static requiresReferenceNumber(paymentMethod: PaymentMethod): boolean {
    return [
      PaymentMethod.ACCOUNT_TRANSFER,
      PaymentMethod.NEFT,
      PaymentMethod.RTGS,
      PaymentMethod.CHEQUE,
    ].includes(paymentMethod as any);
  }

  /**
   * Validates reference number format based on payment method
   */
  static isValidReferenceNumber(referenceNumber: string, paymentMethod: PaymentMethod): boolean {
    if (!referenceNumber || referenceNumber.trim() === '') {
      return false;
    }

    const trimmedRef = referenceNumber.trim();

    switch (paymentMethod) {
      case PaymentMethod.CHEQUE:
        // Cheque number should be numeric, 6-10 digits
        return /^\d{6,10}$/.test(trimmedRef);

      case PaymentMethod.NEFT:
        // NEFT reference should be alphanumeric, 8-20 characters
        return /^[A-Za-z0-9]{8,20}$/.test(trimmedRef);

      case PaymentMethod.RTGS:
        // RTGS reference should be alphanumeric, 8-20 characters
        return /^[A-Za-z0-9]{8,20}$/.test(trimmedRef);

      case PaymentMethod.ACCOUNT_TRANSFER:
        // Account transfer reference should be alphanumeric, 6-20 characters
        return /^[A-Za-z0-9]{6,20}$/.test(trimmedRef);

      default:
        return true; // For other methods, any non-empty string is valid
    }
  }

  /**
   * Validates if payment can be made for a project
   */
  static canMakePayment(projectSummary: ProjectPaymentSummary): boolean {
    return (
      projectSummary.remainingBalance > 0 &&
      projectSummary.totalAmount > 0
    );
  }

  /**
   * Calculates suggested payment amounts
   */
  static getSuggestedPaymentAmounts(projectSummary: ProjectPaymentSummary): number[] {
    const remainingBalance = projectSummary.remainingBalance;
    const suggestions: number[] = [];

    // 25% of remaining balance
    suggestions.push(Math.round(remainingBalance * 0.25));

    // 50% of remaining balance
    suggestions.push(Math.round(remainingBalance * 0.5));

    // 75% of remaining balance
    suggestions.push(Math.round(remainingBalance * 0.75));

    // Full remaining balance
    suggestions.push(remainingBalance);

    // Remove duplicates and sort
    return [...new Set(suggestions)].sort((a, b) => a - b);
  }

  /**
   * Validates payment amount against project balance
   */
  static validatePaymentAmount(
    amount: number,
    projectSummary: ProjectPaymentSummary
  ): { isValid: boolean; message?: string } {
    if (amount <= 0) {
      return { isValid: false, message: 'Payment amount must be greater than zero' };
    }

    if (amount > projectSummary.remainingBalance) {
      return {
        isValid: false,
        message: `Payment amount exceeds remaining balance of ₹${projectSummary.remainingBalance.toLocaleString()}`,
      };
    }

    if (amount > projectSummary.totalAmount) {
      return {
        isValid: false,
        message: `Payment amount exceeds total project amount of ₹${projectSummary.totalAmount.toLocaleString()}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Formats currency amount for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Formats payment method for display
   */
  static formatPaymentMethod(paymentMethod: PaymentMethod): string {
    const methodLabels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Cash',
      [PaymentMethod.ACCOUNT_TRANSFER]: 'Account Transfer',
      [PaymentMethod.CHEQUE]: 'Cheque',
      [PaymentMethod.CARD]: 'Card',
      [PaymentMethod.UPI]: 'UPI',
      [PaymentMethod.NEFT]: 'NEFT',
      [PaymentMethod.RTGS]: 'RTGS',
    };

    return methodLabels[paymentMethod] || paymentMethod;
  }
}
