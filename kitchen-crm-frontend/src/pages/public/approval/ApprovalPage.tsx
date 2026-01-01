/**
 * Customer Approval Page
 * Public page for customers to approve/sign quotations
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, FileText, Clock, Mail, Phone, User } from 'lucide-react';
import approvalService from '../../../services/approvalService';
import type { DocumentDetails } from '../../../types/signature.types';

// Validation schema
const approvalSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  agreed: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

export default function ApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
  });

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      if (!token) {
        setError('Invalid approval link');
        setLoading(false);
        return;
      }

      try {
        const data = await approvalService.getDocumentByToken(token);
        setDocument(data);

        // Pre-fill customer details if available
        if (data.customerName) setValue('customerName', data.customerName);
        if (data.customerEmail) setValue('email', data.customerEmail);
        if (data.customerPhone) setValue('phone', data.customerPhone);

        // Check if already approved
        if (data.status === 'SIGNED') {
          setApproved(true);
        }
      } catch (err: any) {
        console.error('Failed to fetch document:', err);
        setError(err.response?.data?.message || 'Failed to load document. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [token, setValue]);

  // Handle form submission
  const onSubmit = async (data: ApprovalFormData) => {
    if (!token) return;

    setSubmitting(true);
    try {
      // Get client IP
      const ipAddress = await approvalService.getClientIP();

      // Submit approval
      await approvalService.submitApproval(token, {
        signatureType: 'CHECKBOX',
        confirmed: data.agreed,
        customerName: data.customerName,
        customerEmail: data.email,
        comments: undefined,
        ipAddress,
      } as any);

      setApproved(true);
      toast.success('Quotation approved successfully!');
    } catch (err: any) {
      console.error('Failed to submit approval:', err);
      toast.error(err.response?.data?.message || 'Failed to submit approval. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The document could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  // Approved state
  if (approved || document.status === 'SIGNED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quotation Approved!</h1>
          <p className="text-gray-600 mb-2">
            Your quotation <span className="font-semibold">{document.quotationNumber}</span> has
            been approved.
          </p>
          <p className="text-sm text-gray-500">
            We'll contact you shortly to proceed with the project.
          </p>
        </div>
      </div>
    );
  }

  // Expired state
  const isExpired = new Date(document.expiresAt) < new Date();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Clock className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600 mb-6">
            This approval link has expired. Please contact us for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quotation Approval</h1>
              <p className="text-gray-600 mt-1">Please review and approve your quotation</p>
            </div>
            <FileText className="h-12 w-12 text-red-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-600">Quotation Number</p>
              <p className="font-semibold text-gray-900">{document.quotationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-2xl text-red-600">
                {formatCurrency(document.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="font-semibold text-gray-900">{formatDate(document.validUntil)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending Approval
              </span>
            </div>
          </div>
        </div>

        {/* Approval Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Approve Quotation</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Your Name
              </label>
              <input
                type="text"
                {...register('customerName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="+91 XXXXX XXXXX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  {...register('agreed')}
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to all terms and conditions in quotation{' '}
                  <span className="font-semibold">{document.quotationNumber}</span>. I understand
                  that this approval is legally binding and confirms my acceptance of the quoted
                  amount of <span className="font-semibold">{formatCurrency(document.totalAmount)}</span>.
                </span>
              </label>
              {errors.agreed && (
                <p className="mt-2 text-sm text-red-600">{errors.agreed.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </span>
              ) : (
                'Submit Approval'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 HOCH. All rights reserved.</p>
          <p className="mt-1">For assistance, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
}
