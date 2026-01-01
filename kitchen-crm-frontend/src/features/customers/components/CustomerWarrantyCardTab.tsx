import React, { useState, useEffect } from 'react';
import {
  Save,
  FileText,
  Download,
  Mail,
  RefreshCw,
  ShieldCheck,
  Calendar,
  User,
  MapPin,
  FileCheck,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetWarrantyCardByCustomerQuery,
  useUpdateWarrantyCardMutation,
  useGeneratePdfMutation,
  useSendEmailMutation,
  useGenerateCertificateNumberMutation,
  useGetAllWarrantyComponentsQuery,
  useDeleteWarrantyComponentMutation,
  type WarrantyCard,
  type WarrantyComponent,
} from '../../../services/warrantyCardAPI';
import { WarrantyComponentFormModal } from './WarrantyComponentFormModal';

export interface CustomerWarrantyCardTabProps {
  customerId: number;
  customerName?: string;
  customerEmail?: string;
}

export const CustomerWarrantyCardTab: React.FC<CustomerWarrantyCardTabProps> = ({
  customerId,
  customerName,
  customerEmail,
}) => {
  const { data: warrantyCard, isLoading, refetch } = useGetWarrantyCardByCustomerQuery(customerId);
  const { data: warrantyComponents = [], isLoading: componentsLoading, refetch: refetchComponents } = useGetAllWarrantyComponentsQuery();
  const [updateWarrantyCard, { isLoading: isUpdating }] = useUpdateWarrantyCardMutation();
  const [generatePdf, { isLoading: isGeneratingPdf }] = useGeneratePdfMutation();
  const [sendEmail, { isLoading: isSendingEmail }] = useSendEmailMutation();
  const [generateCertNumber, { isLoading: isGeneratingCert }] = useGenerateCertificateNumberMutation();
  const [deleteComponent] = useDeleteWarrantyComponentMutation();

  const [formData, setFormData] = useState<Partial<WarrantyCard>>({});
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<WarrantyComponent | null>(null);

  useEffect(() => {
    if (warrantyCard) {
      setFormData({
        certificateNumber: warrantyCard.certificateNumber || '',
        issueDate: warrantyCard.issueDate || '',
        projectCompletionDate: warrantyCard.projectCompletionDate || '',
        projectAddress: warrantyCard.projectAddress || '',
        projectDescription: warrantyCard.projectDescription || 'Modular Kitchen Design, Supply & Installation',
        authorizedName: warrantyCard.authorizedName || '',
        authorizedDesignation: warrantyCard.authorizedDesignation || '',
        signatureDate: warrantyCard.signatureDate || '',
      });
    }
  }, [warrantyCard]);

  const handleInputChange = (field: keyof WarrantyCard, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!warrantyCard?.id) {
      toast.error('Warranty card not found');
      return;
    }

    try {
      await updateWarrantyCard({
        id: warrantyCard.id,
        data: formData,
      }).unwrap();
      toast.success('Warranty card updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update warranty card');
    }
  };

  const handleGeneratePdf = async () => {
    if (!warrantyCard?.id) {
      toast.error('Warranty card not found');
      return;
    }

    try {
      await generatePdf(warrantyCard.id).unwrap();
      toast.success('PDF generated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate PDF');
    }
  };

  const handleDownloadPdf = async () => {
    if (!warrantyCard?.id) {
      toast.error('PDF not available');
      return;
    }

    try {
      const pdfUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/warranty-cards/${warrantyCard.id}/pdf`;
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Warranty_Certificate_${warrantyCard.certificateNumber || warrantyCard.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download PDF: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSendEmail = async () => {
    if (!warrantyCard?.id) {
      toast.error('Warranty card not found');
      return;
    }

    if (!customerEmail) {
      toast.error('Customer email not available');
      return;
    }

    try {
      await sendEmail(warrantyCard.id).unwrap();
      toast.success('Email sent successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send email');
    }
  };

  const handleGenerateCertNumber = async () => {
    try {
      const certNumber = await generateCertNumber().unwrap();
      handleInputChange('certificateNumber', certNumber);
      toast.success('Certificate number generated');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate certificate number');
    }
  };

  const handleAddComponent = () => {
    setEditingComponent(null);
    setIsComponentModalOpen(true);
  };

  const handleEditComponent = (component: WarrantyComponent) => {
    setEditingComponent(component);
    setIsComponentModalOpen(true);
  };

  const handleDeleteComponent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this warranty component?')) {
      return;
    }

    try {
      await deleteComponent(id).unwrap();
      toast.success('Warranty component deleted successfully');
      refetchComponents();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete warranty component');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-background-800 via-background-700 to-background-800 border border-background-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-900">Warranty Certificate</h1>
              <p className="text-sm text-text-600 mt-1">Manage warranty card details and generate certificates</p>
            </div>
          </div>
          {warrantyCard?.certificateNumber && (
            <div className="text-right">
              <p className="text-xs text-text-600 mb-1">Certificate Number</p>
              <p className="text-lg font-semibold text-primary-500">{warrantyCard.certificateNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-background-800 to-background-700 border border-background-600 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-600 uppercase tracking-wider mb-2">PDF Status</p>
              <p className="text-text-900 font-semibold">
                {warrantyCard?.pdfFilePath ? (
                  <span className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>Generated</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-text-600">
                    <XCircle className="w-5 h-5" />
                    <span>Not Generated</span>
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-background-700/50 rounded-lg">
              <FileText className="w-6 h-6 text-text-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-background-800 to-background-700 border border-background-600 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-600 uppercase tracking-wider mb-2">Email Status</p>
              <p className="text-text-900 font-semibold">
                {warrantyCard?.emailSent ? (
                  <span className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>Sent</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-text-600">
                    <XCircle className="w-5 h-5" />
                    <span>Not Sent</span>
                  </span>
                )}
              </p>
              {warrantyCard?.emailSentAt && (
                <p className="text-xs text-text-500 mt-2">
                  {new Date(warrantyCard.emailSentAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="p-3 bg-background-700/50 rounded-lg">
              <Mail className="w-6 h-6 text-text-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-background-800 to-background-700 border border-background-600 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-600 uppercase tracking-wider mb-2">Last Updated</p>
              <p className="text-text-900 font-semibold text-sm">
                {warrantyCard?.updatedAt
                  ? new Date(warrantyCard.updatedAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            <div className="p-3 bg-background-700/50 rounded-lg">
              <Calendar className="w-6 h-6 text-text-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-gradient-to-br from-background-800 to-background-700 border border-background-600 rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-background-600">
          <div className="p-2 bg-primary-600/20 rounded-lg">
            <FileCheck className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-xl font-bold text-text-900">Certificate Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certificate Number */}
          <div>
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Certificate Number <span className="text-error">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.certificateNumber || ''}
                onChange={(e) => handleInputChange('certificateNumber', e.target.value)}
                className="flex-1 bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="WC-2025-0001"
              />
              <button
                type="button"
                onClick={handleGenerateCertNumber}
                disabled={isGeneratingCert}
                className="px-5 py-3 bg-background-600 hover:bg-background-500 text-text-900 rounded-lg transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow"
              >
                {isGeneratingCert ? '...' : 'Auto'}
              </button>
            </div>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Issue Date <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={formData.issueDate ? formatDate(formData.issueDate) : ''}
              onChange={(e) => handleInputChange('issueDate', e.target.value)}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={customerName || ''}
              readOnly
              className="w-full bg-background-700/30 border border-background-600 rounded-lg px-4 py-3 text-text-500 cursor-not-allowed"
            />
          </div>

          {/* Project Completion Date */}
          <div>
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Project Completion Date
            </label>
            <input
              type="date"
              value={formData.projectCompletionDate ? formatDate(formData.projectCompletionDate) : ''}
              onChange={(e) => handleInputChange('projectCompletionDate', e.target.value)}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Project Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Project Address
            </label>
            <textarea
              value={formData.projectAddress || ''}
              onChange={(e) => handleInputChange('projectAddress', e.target.value)}
              rows={3}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter project installation address"
            />
          </div>

          {/* Project Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Project Description
            </label>
            <input
              type="text"
              value={formData.projectDescription || ''}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Modular Kitchen Design, Supply & Installation"
            />
          </div>

          {/* Authorized Name */}
          <div>
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Authorized Name
            </label>
            <input
              type="text"
              value={formData.authorizedName || ''}
              onChange={(e) => handleInputChange('authorizedName', e.target.value)}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Authorized signatory name"
            />
          </div>

          {/* Authorized Designation */}
          <div>
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Authorized Designation
            </label>
            <input
              type="text"
              value={formData.authorizedDesignation || ''}
              onChange={(e) => handleInputChange('authorizedDesignation', e.target.value)}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Designation"
            />
          </div>

          {/* Signature Date */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-text-700 mb-2">
              Signature Date
            </label>
            <input
              type="date"
              value={formData.signatureDate ? formatDate(formData.signatureDate) : ''}
              onChange={(e) => handleInputChange('signatureDate', e.target.value)}
              className="w-full bg-background-700/50 border border-background-600 rounded-lg px-4 py-3 text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Warranty Components Management */}
      <div className="bg-gradient-to-br from-background-800 to-background-700 border border-background-600 rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-background-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600/20 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-text-900">Warranty Components</h2>
          </div>
          <button
            type="button"
            onClick={handleAddComponent}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Component
          </button>
        </div>

        {componentsLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-text-600">Loading components...</div>
          </div>
        ) : warrantyComponents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-600 mb-4">No warranty components added yet</p>
            <button
              onClick={handleAddComponent}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Component
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-background-600">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background-700/50 border-b border-background-600">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-text-700 uppercase tracking-wider">Component Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-text-700 uppercase tracking-wider">Warranty Period</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-text-700 uppercase tracking-wider">Status</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-text-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warrantyComponents.map((component, index) => (
                  <tr 
                    key={component.id} 
                    className={`border-b border-background-600/50 hover:bg-background-700/30 transition-colors ${
                      index % 2 === 0 ? 'bg-background-800/30' : 'bg-transparent'
                    }`}
                  >
                    <td className="py-4 px-6 text-text-900 font-medium">{component.componentName}</td>
                    <td className="py-4 px-6 text-text-700">{component.warrantyPeriod}</td>
                    <td className="py-4 px-6 text-center">
                      {component.active ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-success/30 text-success rounded-full border border-success/50">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-background-700 text-text-600 rounded-full border border-background-600/50">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditComponent(component)}
                          className="p-2 text-text-600 hover:text-info hover:bg-info/10 rounded-lg transition-all"
                          title="Edit component"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComponent(component.id)}
                          className="p-2 text-text-600 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          title="Delete component"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-br from-background-800 to-background-700 border border-background-600 rounded-xl p-6 shadow-lg">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-lg transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
          >
            <Save className="w-4 h-4" />
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || !warrantyCard?.id}
            className="flex items-center gap-2 px-6 py-3 bg-info hover:bg-info/80 text-text-900 rounded-lg transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" />
            {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
          </button>

          {warrantyCard?.pdfFilePath && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-6 py-3 bg-success hover:bg-success/80 text-text-900 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}

          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isSendingEmail || !warrantyCard?.id || !customerEmail || !warrantyCard?.pdfFilePath}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-text-900 rounded-lg transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
            title={!customerEmail ? 'Customer email not available' : !warrantyCard?.pdfFilePath ? 'Please generate PDF first' : ''}
          >
            <Mail className="w-4 h-4" />
            {isSendingEmail ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>

      {/* Warranty Component Form Modal */}
      <WarrantyComponentFormModal
        isOpen={isComponentModalOpen}
        onClose={() => {
          setIsComponentModalOpen(false);
          setEditingComponent(null);
          refetchComponents();
        }}
        component={editingComponent}
      />
    </div>
  );
};

