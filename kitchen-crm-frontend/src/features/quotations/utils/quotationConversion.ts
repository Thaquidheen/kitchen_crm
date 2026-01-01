// Quotation to Project conversion utilities

import { useConvertQuotationToProjectMutation } from '../../projects/projectsAPI';
import type { QuotationSummary } from '../types';

/**
 * Hook for converting quotation to project
 * Returns the mutation function and loading state
 */
export function useQuotationConversion() {
  const [convertQuotationToProject, { isLoading, error }] = useConvertQuotationToProjectMutation();

  const convertToProject = async (quotationId: number) => {
    try {
      const result = await convertQuotationToProject({ quotationId }).unwrap();
      return result;
    } catch (err) {
      throw err;
    }
  };

  return {
    convertToProject,
    isConverting: isLoading,
    conversionError: error,
  };
}

/**
 * Check if a quotation can be converted to project
 */
export function canConvertToProject(quotation: QuotationSummary): boolean {
  return quotation.status === 'APPROVED';
}

/**
 * Get conversion status message
 */
export function getConversionStatusMessage(quotation: QuotationSummary): string {
  switch (quotation.status) {
    case 'APPROVED':
      return 'Ready to convert to project';
    case 'SENT':
      return 'Awaiting customer approval';
    case 'DRAFT':
      return 'Quotation must be sent and approved first';
    case 'REJECTED':
      return 'Cannot convert rejected quotation';
    case 'REVISED':
      return 'Quotation must be approved before conversion';
    default:
      return 'Unknown status';
  }
}

/**
 * Get conversion button text
 */
export function getConversionButtonText(quotation: QuotationSummary): string {
  return canConvertToProject(quotation) ? 'Convert to Project' : 'Cannot Convert';
}

/**
 * Get conversion button variant
 */
export function getConversionButtonVariant(quotation: QuotationSummary): 'primary' | 'secondary' | 'disabled' {
  return canConvertToProject(quotation) ? 'primary' : 'secondary';
}
