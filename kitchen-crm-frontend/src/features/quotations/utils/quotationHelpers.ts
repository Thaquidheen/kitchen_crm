// Quotation helper utilities

import type { QuotationSummary } from '../types';
import { QuotationStatus } from '../types';

/**
 * Sort quotations by different criteria
 */
export function sortQuotations(
  quotations: QuotationSummary[],
  sortBy: string,
  sortDir: 'asc' | 'desc'
): QuotationSummary[] {
  return [...quotations].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'quotationNumber':
        aValue = a.quotationNumber;
        bValue = b.quotationNumber;
        break;
      case 'customerName':
        aValue = a.customerName;
        bValue = b.customerName;
        break;
      case 'projectName':
        aValue = a.projectName || '';
        bValue = b.projectName || '';
        break;
      case 'totalAmount':
        aValue = a.totalAmount;
        bValue = b.totalAmount;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'validUntil':
        aValue = a.validUntil ? new Date(a.validUntil) : new Date(0);
        bValue = b.validUntil ? new Date(b.validUntil) : new Date(0);
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (aValue < bValue) {
      return sortDir === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDir === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Filter quotations based on criteria
 */
export function filterQuotations(
  quotations: QuotationSummary[],
  filters: {
    status?: QuotationStatus;
    customerName?: string;
    projectName?: string;
    fromDate?: string;
    toDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }
): QuotationSummary[] {
  return quotations.filter(quotation => {
    // Status filter
    if (filters.status && quotation.status !== filters.status) {
      return false;
    }

    // Customer name filter (case insensitive)
    if (filters.customerName) {
      const customerName = quotation.customerName.toLowerCase();
      const filterName = filters.customerName.toLowerCase();
      if (!customerName.includes(filterName)) {
        return false;
      }
    }

    // Project name filter (case insensitive)
    if (filters.projectName && quotation.projectName) {
      const projectName = quotation.projectName.toLowerCase();
      const filterName = filters.projectName.toLowerCase();
      if (!projectName.includes(filterName)) {
        return false;
      }
    }

    // Date range filter
    if (filters.fromDate) {
      const quotationDate = new Date(quotation.createdAt);
      const fromDate = new Date(filters.fromDate);
      if (quotationDate < fromDate) {
        return false;
      }
    }

    if (filters.toDate) {
      const quotationDate = new Date(quotation.createdAt);
      const toDate = new Date(filters.toDate);
      if (quotationDate > toDate) {
        return false;
      }
    }

    // Amount range filter
    if (filters.minAmount !== undefined && quotation.totalAmount < filters.minAmount) {
      return false;
    }

    if (filters.maxAmount !== undefined && quotation.totalAmount > filters.maxAmount) {
      return false;
    }

    return true;
  });
}

/**
 * Search quotations by text
 */
export function searchQuotations(
  quotations: QuotationSummary[],
  searchTerm: string
): QuotationSummary[] {
  if (!searchTerm.trim()) {
    return quotations;
  }

  const term = searchTerm.toLowerCase();
  return quotations.filter(quotation => {
    return (
      quotation.quotationNumber.toLowerCase().includes(term) ||
      quotation.customerName.toLowerCase().includes(term) ||
      (quotation.projectName && quotation.projectName.toLowerCase().includes(term))
    );
  });
}

/**
 * Get quotation status count
 */
export function getQuotationStatusCount(quotations: QuotationSummary[]): Record<QuotationStatus, number> {
  const counts = {
    [QuotationStatus.DRAFT]: 0,
    [QuotationStatus.SENT]: 0,
    [QuotationStatus.APPROVED]: 0,
    [QuotationStatus.REJECTED]: 0,
    [QuotationStatus.REVISED]: 0,
  };

  quotations.forEach(quotation => {
    counts[quotation.status]++;
  });

  return counts;
}

/**
 * Get quotations by status
 */
export function getQuotationsByStatus(
  quotations: QuotationSummary[],
  status: QuotationStatus
): QuotationSummary[] {
  return quotations.filter(quotation => quotation.status === status);
}

/**
 * Get quotations by customer
 */
export function getQuotationsByCustomer(
  quotations: QuotationSummary[],
  customerId: number
): QuotationSummary[] {
  return quotations.filter(quotation => (quotation as any).customerId === customerId);
}

/**
 * Get recent quotations (last 30 days)
 */
export function getRecentQuotations(quotations: QuotationSummary[]): QuotationSummary[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return quotations.filter(quotation => {
    const createdAt = new Date(quotation.createdAt);
    return createdAt >= thirtyDaysAgo;
  });
}

/**
 * Get expired quotations
 */
export function getExpiredQuotations(quotations: QuotationSummary[]): QuotationSummary[] {
  const today = new Date();
  return quotations.filter(quotation => {
    if (!quotation.validUntil) return false;
    const validUntil = new Date(quotation.validUntil);
    return validUntil < today;
  });
}

/**
 * Get quotations expiring soon (within 7 days)
 */
export function getQuotationsExpiringSoon(quotations: QuotationSummary[]): QuotationSummary[] {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  return quotations.filter(quotation => {
    if (!quotation.validUntil) return false;
    const validUntil = new Date(quotation.validUntil);
    return validUntil >= today && validUntil <= sevenDaysFromNow;
  });
}

/**
 * Calculate quotation statistics
 */
export function calculateQuotationStatistics(quotations: QuotationSummary[]): {
  totalCount: number;
  totalValue: number;
  averageValue: number;
  statusCounts: Record<QuotationStatus, number>;
  conversionRate: number;
} {
  const totalCount = quotations.length;
  const totalValue = quotations.reduce((sum, quotation) => sum + quotation.totalAmount, 0);
  const averageValue = totalCount > 0 ? totalValue / totalCount : 0;
  const statusCounts = getQuotationStatusCount(quotations);
  
  // Calculate conversion rate (approved / sent)
  const sentCount = statusCounts[QuotationStatus.SENT];
  const approvedCount = statusCounts[QuotationStatus.APPROVED];
  const conversionRate = sentCount > 0 ? (approvedCount / sentCount) * 100 : 0;

  return {
    totalCount,
    totalValue,
    averageValue,
    statusCounts,
    conversionRate,
  };
}

/**
 * Format quotation number for display
 */
export function formatQuotationNumber(quotationNumber: string): string {
  return quotationNumber || 'N/A';
}

/**
 * Get quotation priority based on status and validity
 */
export function getQuotationPriority(quotation: QuotationSummary): 'high' | 'medium' | 'low' {
  const today = new Date();
  const validUntil = quotation.validUntil ? new Date(quotation.validUntil) : null;
  
  // High priority: expired or expiring soon
  if (validUntil && validUntil < today) {
    return 'high';
  }
  
  if (validUntil) {
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 3) {
      return 'high';
    }
  }
  
  // Medium priority: draft or revised
  if (quotation.status === QuotationStatus.DRAFT || quotation.status === QuotationStatus.REVISED) {
    return 'medium';
  }
  
  // Low priority: others
  return 'low';
}

/**
 * Check if quotation can be edited
 */
export function canEditQuotation(quotation: QuotationSummary): boolean {
  return quotation.status === QuotationStatus.DRAFT || quotation.status === QuotationStatus.REVISED;
}

/**
 * Check if quotation can be deleted
 */
export function canDeleteQuotation(quotation: QuotationSummary): boolean {
  return quotation.status === QuotationStatus.DRAFT;
}

/**
 * Check if quotation can be converted to project
 */
export function canConvertToProject(quotation: QuotationSummary): boolean {
  return quotation.status === QuotationStatus.APPROVED;
}

/**
 * Get quotation action buttons based on status
 */
export function getQuotationActions(quotation: QuotationSummary): string[] {
  const actions: string[] = ['view'];
  
  if (canEditQuotation(quotation)) {
    actions.push('edit');
  }
  
  if (quotation.status === QuotationStatus.DRAFT) {
    actions.push('send');
  }
  
  if (quotation.status === QuotationStatus.SENT) {
    actions.push('approve', 'reject');
  }
  
  if (quotation.status === QuotationStatus.APPROVED) {
    actions.push('convert');
  }
  
  actions.push('duplicate', 'download');
  
  if (canDeleteQuotation(quotation)) {
    actions.push('delete');
  }
  
  return actions;
}
