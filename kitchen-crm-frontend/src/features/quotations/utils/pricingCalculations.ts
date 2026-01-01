// Pricing calculation utilities for quotations

import type { QuotationFormData, QuotationTotals, CategoryTotals } from '../types';

/**
 * Calculate quotation totals based on form data
 */
export function calculateQuotationTotals(quotation: QuotationFormData): QuotationTotals {
  // Calculate category-wise base totals
  const cabinetsBase = quotation.cabinets.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity),
    0
  );
  
  const doorsBase = quotation.doors.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity),
    0
  );
  
  const accessoriesBase = quotation.accessories.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity),
    0
  );
  
  const lightingBase = quotation.lighting.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity),
    0
  );

  // Product subtotal
  const productsSubtotal = cabinetsBase + doorsBase + accessoriesBase + lightingBase;

  // Add transportation and installation
  const subtotal = productsSubtotal +
                   quotation.transportationPrice +
                   quotation.installationPrice;

  // Calculate margin
  const marginAmount = (subtotal * quotation.marginPercentage) / 100;

  // Calculate tax on (subtotal + margin)
  const taxableAmount = subtotal + marginAmount;
  const taxAmount = (taxableAmount * quotation.taxPercentage) / 100;

  // Total
  const totalAmount = taxableAmount + taxAmount;

  // Calculate category-wise totals with margin and tax
  const calculateCategoryTotal = (baseTotal: number): CategoryTotals => {
    const categoryMargin = (baseTotal * quotation.marginPercentage) / 100;
    const categoryTaxable = baseTotal + categoryMargin;
    const categoryTax = (categoryTaxable * quotation.taxPercentage) / 100;
    const categoryFinal = categoryTaxable + categoryTax;

    return {
      base: baseTotal,
      margin: categoryMargin,
      tax: categoryTax,
      final: categoryFinal,
    };
  };

  return {
    subtotal,
    marginAmount,
    taxAmount,
    totalAmount,
    accessories: calculateCategoryTotal(accessoriesBase),
    cabinets: calculateCategoryTotal(cabinetsBase),
    doors: calculateCategoryTotal(doorsBase),
    lighting: calculateCategoryTotal(lightingBase),
  };
}

/**
 * Calculate individual line item totals
 */
export function calculateLineItemTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

/**
 * Calculate square footage for cabinets/doors
 */
export function calculateSquareFootage(widthMm: number, heightMm: number): number {
  const widthFt = widthMm / 304.8; // Convert mm to feet
  const heightFt = heightMm / 304.8;
  return widthFt * heightFt;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Validate quotation form data
 */
export function validateQuotationForm(data: QuotationFormData): string[] {
  const errors: string[] = [];

  if (!data.customerId) {
    errors.push('Customer is required');
  }

  if (data.transportationPrice < 0) {
    errors.push('Transportation price cannot be negative');
  }

  if (data.installationPrice < 0) {
    errors.push('Installation price cannot be negative');
  }

  if (data.marginPercentage < 0 || data.marginPercentage > 100) {
    errors.push('Margin percentage must be between 0 and 100');
  }

  if (data.taxPercentage < 0 || data.taxPercentage > 100) {
    errors.push('Tax percentage must be between 0 and 100');
  }

  // Validate line items
  const allItems = [
    ...data.accessories,
    ...data.cabinets,
    ...data.doors,
    ...data.lighting
  ];

  if (allItems.length === 0) {
    errors.push('At least one product must be added to the quotation');
  }

  // Validate individual line items
  allItems.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if (item.unitPrice <= 0) {
      errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
    }
  });

  return errors;
}

/**
 * Generate quotation number (client-side fallback)
 */
export function generateQuotationNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `QUO-${year}-${timestamp}`;
}

/**
 * Calculate quotation validity date (default 30 days from now)
 */
export function getDefaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

/**
 * Check if quotation is expired
 */
export function isQuotationExpired(validUntil: string): boolean {
  const validDate = new Date(validUntil);
  const today = new Date();
  return validDate < today;
}

/**
 * Get quotation status color for UI
 */
export function getQuotationStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'gray';
    case 'SENT':
      return 'blue';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'REVISED':
      return 'orange';
    default:
      return 'gray';
  }
}

/**
 * Get quotation status label for UI
 */
export function getQuotationStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SENT':
      return 'Sent';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'REVISED':
      return 'Revised';
    default:
      return status;
  }
}

/**
 * Calculate quotation completion percentage
 */
export function calculateQuotationCompletion(data: QuotationFormData): number {
  let completedFields = 0;
  const totalFields = 8;

  if (data.customerId) completedFields++;
  if (data.projectName) completedFields++;
  if (data.transportationPrice >= 0) completedFields++;
  if (data.installationPrice >= 0) completedFields++;
  if (data.marginPercentage >= 0) completedFields++;
  if (data.taxPercentage >= 0) completedFields++;
  if (data.validUntil) completedFields++;
  if (data.accessories.length > 0 || data.cabinets.length > 0 || 
      data.doors.length > 0 || data.lighting.length > 0) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Export quotation data to CSV format
 */
export function exportQuotationToCSV(quotation: any): string {
  const headers = [
    'Quotation Number',
    'Customer Name',
    'Project Name',
    'Total Amount',
    'Status',
    'Valid Until',
    'Created At'
  ];

  const row = [
    quotation.quotationNumber || '',
    quotation.customerName || '',
    quotation.projectName || '',
    quotation.totalAmount || 0,
    quotation.status || '',
    quotation.validUntil || '',
    quotation.createdAt || ''
  ];

  return [headers.join(','), row.join(',')].join('\n');
}
