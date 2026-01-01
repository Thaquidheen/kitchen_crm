import React, { useState } from 'react';
import { FileText, Plus, Eye, Download, Copy, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetQuotationsByCustomerQuery } from '@/features/quotations/quotationsAPI';
import toast from 'react-hot-toast';

export interface CustomerQuotationsTabProps {
  customerId: number;
}

export const CustomerQuotationsTab: React.FC<CustomerQuotationsTabProps> = ({ customerId }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  // Fetch quotations for this customer
  const { data: response, isLoading, error } = useGetQuotationsByCustomerQuery(customerId);

  const quotations = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 0;
  const totalElements = response?.data?.totalElements || 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-background-500/20 text-text-500 border-background-500',
      SENT: 'bg-info/20 text-info border-info',
      ACCEPTED: 'bg-success/20 text-success border-success',
      REJECTED: 'bg-error/20 text-error border-error',
      EXPIRED: 'bg-warning/20 text-warning border-warning',
    };
    return colors[status] || colors.DRAFT;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadPDF = async (quotationId: number) => {
    try {
      // TODO: Implement PDF download
      toast.success('PDF download coming soon!');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-background-800 border border-background-600 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-background-600 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-background-600 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/20 border border-error rounded-lg p-4">
        <p className="text-error">Failed to load quotations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-900">Quotations</h2>
          <p className="text-sm text-text-600 mt-1">
            {totalElements} quotation{totalElements !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => navigate(`/quotations/new?customerId=${customerId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-text-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-900 mb-2">No Quotations Yet</h3>
          <p className="text-text-600 mb-6">
            Create your first quotation for this customer to get started
          </p>
          <button
            onClick={() => navigate(`/quotations/new?customerId=${customerId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((quotation) => (
            <div
              key={quotation.id}
              className="bg-background-800 border border-background-600 rounded-lg p-4 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Quotation Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-900">
                      {quotation.projectName || `Quotation #${quotation.quotationNumber}`}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(
                        quotation.status
                      )}`}
                    >
                      {quotation.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-600 mb-3">
                    Quotation #{quotation.quotationNumber}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-text-600">Amount: </span>
                      <span className="text-text-900 font-semibold">
                        {formatCurrency(quotation.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-600">Created: </span>
                      <span className="text-text-900">{formatDate(quotation.createdAt)}</span>
                    </div>
                    {quotation.validUntil && (
                      <div>
                        <span className="text-text-600">Valid Until: </span>
                        <span className="text-text-900">{formatDate(quotation.validUntil)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/quotations/${quotation.id}`)}
                    className="p-2 text-text-900 hover:bg-background-700 rounded-md transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                    className="p-2 text-text-900 hover:bg-background-700 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(quotation.id)}
                    className="p-2 text-text-900 hover:bg-background-700 rounded-md transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/quotations/new?duplicateFrom=${quotation.id}`)}
                    className="p-2 text-text-900 hover:bg-background-700 rounded-md transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerQuotationsTab;
