/**
 * QuotationDetailPage
 * Detail view for a single quotation
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetQuotationByIdQuery, useDuplicateQuotationMutation, useDownloadQuotationPDFMutation } from '@/features/quotations/quotationsAPI';
import { StatusBadge } from '@/components/shared/StatusBadge';
import SignatureManagement from '@/components/quotations/SignatureManagement';
import { Copy, Download, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quotationId = Number(id);
  const { data, isLoading, error } = useGetQuotationByIdQuery(quotationId, { skip: isNaN(quotationId) });
  const [duplicateQuotation, { isLoading: isDuplicating }] = useDuplicateQuotationMutation();
  const [downloadQuotationPDF, { isLoading: isDownloading }] = useDownloadQuotationPDFMutation();

  const handleDuplicate = async () => {
    try {
      const result = await duplicateQuotation(quotationId).unwrap();
      toast.success('Quotation duplicated successfully');
      navigate(`/quotations/${result.id}/edit`);
    } catch (error: any) {
      console.error('Error duplicating quotation:', error);
      toast.error(error?.data?.message || 'Failed to duplicate quotation');
    }
  };

  const handleEdit = () => {
    navigate(`/quotations/${quotationId}/edit`);
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadQuotationPDF(quotationId).unwrap();
      // If server accidentally returns JSON error, guard it
      if (!(blob instanceof Blob)) {
        throw blob;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `quotation_${(data as any)?.quotationNumber || quotationId}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Quotation PDF download started');
    } catch (error: any) {
      console.error('PDF download error:', error);
      toast.error(error?.data?.message || 'Failed to download PDF');
    }
  };

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
          <div className="text-text-700">Failed to load quotation</div>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
          <div className="h-6 w-40 bg-background-700 rounded animate-pulse" />
          <div className="mt-4 h-4 w-64 bg-background-700 rounded animate-pulse" />
        </Card>
      </div>
    );
  }

  // Debug logging for signature data
  console.log('QuotationDetailPage data:', {
    id: data.id,
    refNo: data.refNo,
    quotationNumber: data.quotationNumber,
    status: data.status,
    signedDocumentId: data.signedDocumentId,
    signatureStatus: data.signatureStatus,
    quotationSignedAt: data.quotationSignedAt,
  });

  // Validate quotation ID before passing to SignatureManagement
  if (!data.id) {
    console.error('Quotation ID is missing from data:', data);
    return (
      <div className="min-h-screen bg-background-900 p-4 sm:p-6">
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
          <div className="text-error">Error: Quotation ID is missing</div>
        </Card>
      </div>
    );
  }

  // Determine if quotation can be edited
  const canEdit = data.status === 'DRAFT' || data.status === 'PENDING';

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-900">Quotation {data.refNo}</h2>
            <div className="mt-2 text-sm sm:text-base text-text-700">Customer: {data.customerName}</div>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-text-700">
          <div>
            <div className="font-semibold text-text-800 mb-2">Details</div>
            <div className="text-sm sm:text-base">Amount: ₹{data.totalAmount?.toLocaleString('en-IN') ?? '-'}</div>
            <div className="text-sm sm:text-base">Created: {data.createdAt ? new Date(data.createdAt).toLocaleString() : '-'}</div>
          </div>
          <div>
            <div className="font-semibold text-text-800 mb-2">Actions</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleEdit}
                disabled={!canEdit}
                title={!canEdit ? 'Cannot edit approved/rejected quotations' : 'Edit quotation'}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadPDF} disabled={isDownloading} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
                <span className="sm:hidden">{isDownloading ? 'Downloading...' : 'PDF'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-1" />
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Details Section (shown when signed) */}
      {data.signatureStatus === 'SIGNED' && data.quotationSignedAt && (
        <Card className="mt-4 sm:mt-6 p-4 sm:p-6 bg-background-800 border-background-600">
          <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-4">Approval Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-700">
            <div>
              <label className="text-xs sm:text-sm text-text-600 block mb-1">Approved By</label>
              <p className="font-medium text-sm sm:text-base text-text-900">
                {(data as any).signerName || data.customerName || '-'}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-text-600 block mb-1">Email</label>
              <p className="font-medium text-sm sm:text-base text-text-900">
                {(data as any).signerEmail || data.customerEmail || '-'}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-text-600 block mb-1">Phone</label>
              <p className="font-medium text-sm sm:text-base text-text-900">
                {(data as any).signerPhone || '-'}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-text-600 block mb-1">Approved At</label>
              <p className="font-medium text-sm sm:text-base text-text-900">
                {new Date(data.quotationSignedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Signature Management Section (Phase 6 Integration) */}
      <div className="mt-4 sm:mt-6">
        <SignatureManagement
          quotationId={data.id}
          quotationNumber={data.refNo || data.quotationNumber || ''}
          quotationStatus={data.status}
          signedDocumentId={data.signedDocumentId}
          signatureStatus={data.signatureStatus}
          quotationSignedAt={data.quotationSignedAt}
        />
      </div>
    </div>
  );
}

export default QuotationDetailPage;


