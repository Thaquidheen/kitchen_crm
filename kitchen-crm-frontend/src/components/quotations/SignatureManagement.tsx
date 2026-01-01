/**
 * Signature Management Component
 * Admin interface for managing quotation signatures
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  ExternalLink,
  Copy,
} from 'lucide-react';
import approvalService from '../../services/approvalService';

interface SignatureManagementProps {
  quotationId: number;
  quotationNumber: string;
  quotationStatus: string;
  signedDocumentId?: number;
  signatureStatus?: string;
  quotationSignedAt?: string;
}

interface SignedDocument {
  id: number;
  token: string;
  status: string;
  sentAt: string;
  expiresAt: string;
  signedAt?: string;
  signerName?: string;
  signerEmail?: string;
  signerPhone?: string;
  signerIp?: string;
  pdfUrl?: string;
  approvedPdfUrl?: string;
}

export default function SignatureManagement({
  quotationId,
  quotationNumber,
  quotationStatus,
  signedDocumentId,
  signatureStatus,
  quotationSignedAt,
}: SignatureManagementProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [documents, setDocuments] = useState<SignedDocument[]>([]);
  const [showCopied, setShowCopied] = useState(false);

  // Debug logging
  console.log('SignatureManagement props:', {
    quotationId,
    quotationNumber,
    quotationStatus,
    signedDocumentId,
    signatureStatus,
    quotationSignedAt,
  });

  // Fetch signed documents on mount and when quotationId changes
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await approvalService.getSignedDocuments(quotationId);
      console.log('Fetched documents:', docs);
      // Ensure docs is always an array
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load signature documents');
      // Set empty array on error to prevent undefined
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Send for signature
  const handleSendForSignature = async () => {
    console.log('Sending for signature with quotationId:', quotationId);
    console.log('quotationId type:', typeof quotationId);
    console.log('quotationId value:', quotationId);
    
    if (!quotationId) {
      console.error('quotationId is falsy:', quotationId);
      toast.error(`Invalid quotation ID: ${quotationId}`);
      return;
    }
    
    if (isNaN(Number(quotationId))) {
      console.error('quotationId is not a number:', quotationId);
      toast.error(`Quotation ID must be a number, got: ${quotationId}`);
      return;
    }
    
    setSending(true);
    try {
      await approvalService.sendForSignature(quotationId);
      toast.success('Signature request sent successfully!');
      // Refresh documents list
      await fetchDocuments();
    } catch (error: any) {
      console.error('Failed to send for signature:', error);
      toast.error(error.response?.data?.message || 'Failed to send signature request');
    } finally {
      setSending(false);
    }
  };

  // Resend notification
  const handleResendNotification = async (documentId: number) => {
    try {
      await approvalService.resendNotification(documentId);
      toast.success('Notification resent successfully!');
    } catch (error: any) {
      console.error('Failed to resend notification:', error);
      toast.error('Failed to resend notification');
    }
  };

  // Download document
  const handleDownloadDocument = async (documentId: number) => {
    try {
      const blob = await approvalService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotationNumber}-approved.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  // Copy signing link
  const copySigningLink = (token: string) => {
    const link = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    toast.success('Signing link copied to clipboard!');
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Open signing link
  const openSigningLink = (token: string) => {
    const link = `${window.location.origin}/sign/${token}`;
    window.open(link, '_blank');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { color: 'bg-warning/20 text-warning', icon: Clock, text: 'Pending' },
      SENT: { color: 'bg-info/20 text-info', icon: Send, text: 'Sent' },
      SIGNED: { color: 'bg-success/20 text-success', icon: CheckCircle, text: 'Approved' },
      REJECTED: { color: 'bg-error/20 text-error', icon: XCircle, text: 'Rejected' },
      EXPIRED: { color: 'bg-background-500/20 text-text-600', icon: Clock, text: 'Expired' },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  // Format date safely (supports ISO string, ms, or seconds). Returns '-' if invalid/zero.
  const formatDate = (value: any) => {
    if (value === null || value === undefined || value === '' || value === 0 || value === '0') {
      return '-';
    }

    let timestamp = value;

    // If it's a string that is numeric, coerce to number
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      timestamp = Number(timestamp);
    }

    // If it's a number and likely in seconds (e.g., 10 digits), convert to ms
    if (typeof timestamp === 'number') {
      if (timestamp < 1e12) {
        timestamp = timestamp * 1000; // seconds -> ms
      }
      const d = new Date(timestamp);
      if (isNaN(d.getTime()) || d.getTime() === 0) return '-';
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Otherwise, attempt to parse as date string
    const d = new Date(value);
    if (isNaN(d.getTime()) || d.getTime() === 0) return '-';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-background-800 border-background-600 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-900">Digital Signature</h2>

        {/* Send for Signature Button */}
        {!signedDocumentId && quotationStatus !== 'APPROVED' && (
          <button
            onClick={handleSendForSignature}
            disabled={sending}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-text-900 transition-colors ${
              sending
                ? 'bg-background-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </>
            )}
          </button>
        )}
      </div>

      {/* Signature Status */}
      {signedDocumentId && signatureStatus && (
        <div className="bg-background-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-700">Status</span>
            {getStatusBadge(signatureStatus)}
          </div>

          {quotationSignedAt && (
            <div className="mt-2">
              <span className="text-sm font-medium text-text-700">Approved on: </span>
              <span className="text-sm text-text-600">{formatDate(quotationSignedAt)}</span>
            </div>
          )}

          {signatureStatus === 'SIGNED' && (
            <button
              onClick={() => handleDownloadDocument(signedDocumentId)}
              className="mt-4 flex items-center text-primary-400 hover:text-primary-300 font-medium text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Download Approved Quotation
            </button>
          )}
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto"></div>
          <p className="mt-2 text-sm text-text-600">Loading documents...</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-700 mb-3">Signature Requests</h3>

          {documents.map((doc, index) => {
            console.log('Rendering document:', doc, 'index:', index, 'key:', doc.id || `doc-${index}`);
            return (
            <div key={doc.id || `doc-${index}`} className="border border-background-600 rounded-lg p-4 bg-background-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(doc.status)}
                    <span className="text-xs text-text-500">
                      Sent: {formatDate(doc.sentAt)}
                    </span>
                  </div>

                  {doc.status === 'SIGNED' && doc.signerName && (
                    <div className="mt-2 text-xs sm:text-sm">
                      <p className="text-text-700">
                        <span className="font-medium">Signed by:</span> {doc.signerName}
                      </p>
                      <p className="text-text-600">Email: {doc.signerEmail}</p>
                      <p className="text-text-600">Phone: {doc.signerPhone}</p>
                      {doc.signedAt && (
                        <p className="text-text-600">Date: {formatDate(doc.signedAt)}</p>
                      )}
                      {doc.signerIp && (
                        <p className="text-xs text-text-500 mt-1">IP: {doc.signerIp}</p>
                      )}
                    </div>
                  )}

                  {doc.status === 'PENDING' || doc.status === 'SENT' && (
                    <p className="text-xs text-text-500 mt-1">
                      Expires: {formatDate(doc.expiresAt)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {(doc.status === 'PENDING' || doc.status === 'SENT') && (
                    <>
                      <button
                        onClick={() => copySigningLink(doc.token)}
                        className="p-2 text-text-600 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Copy signing link"
                      >
                        {showCopied ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => openSigningLink(doc.token)}
                        className="p-2 text-text-600 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Open signing page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleResendNotification(doc.id)}
                        className="p-2 text-text-600 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Resend notification"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {doc.status === 'SIGNED' && doc.approvedPdfUrl && (
                    <button
                      onClick={() => handleDownloadDocument(doc.id)}
                      className="p-2 text-text-600 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors"
                      title="Download approved PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : signedDocumentId ? (
        <div className="text-center py-6 sm:py-8 text-text-500">
          <p className="text-xs sm:text-sm">No signature requests found</p>
        </div>
      ) : (
        <div className="bg-info/20 rounded-lg p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm text-info">
            Click "Send for Signature" to request customer approval via email.
          </p>
        </div>
      )}
    </div>
  );
}
