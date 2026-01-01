/**
 * QuotationConverter Component
 * Convert an approved quotation to a project
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { useGetQuotationsQuery } from '@/features/quotations/quotationsAPI';
import { useConvertQuotationToProjectMutation } from '../projectsAPI';
import { ProjectStatus } from '../types';
import { QuotationStatus } from '@/features/quotations/types';
import toast from 'react-hot-toast';
import { FileText, ArrowRight } from 'lucide-react';

export function QuotationConverter() {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number>(0);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [status, setStatus] = useState<string>(ProjectStatus.ACTIVE);

  const { data: quotationsData } = useGetQuotationsQuery({
    status: QuotationStatus.APPROVED,
    page: 0,
    size: 100,
  });

  const [convertQuotation, { isLoading }] = useConvertQuotationToProjectMutation();

  const selectedQuotation = quotationsData?.content?.find(
    (q) => q.id === selectedQuotationId
  );

  const handleConvert = async () => {
    if (!selectedQuotationId) {
      toast.error('Please select a quotation');
      return;
    }

    if (!projectName) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      const result = await convertQuotation({
        quotationId: selectedQuotationId,
      }).unwrap();

      toast.success('Quotation converted to project successfully');
      navigate(`/projects/${result.id}`);
    } catch (error: any) {
      console.error('Error converting quotation:', error);
      toast.error(error?.data?.message || 'Failed to convert quotation');
    }
  };

  const approvedQuotations = quotationsData?.content || [];

  return (
    <div className="max-w-4xl mx-auto">
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${currentTheme?.colors?.error || '#dc2626'}20` }}
          >
            <FileText
              className="h-6 w-6"
              style={{ color: currentTheme?.colors?.error || '#dc2626' }}
            />
          </div>
          <h2
            className="text-lg sm:text-xl font-bold"
            style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
          >
            Convert Quotation to Project
          </h2>
        </div>

        {approvedQuotations.length === 0 ? (
          <div className="text-center py-8">
            <FileText
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            />
            <p
              className="mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}
            >
              No approved quotations available
            </p>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Only approved quotations can be converted to projects
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Quotation Selection */}
            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">
                Select Approved Quotation <span className="text-red-600">*</span>
              </label>
              <Select
                value={selectedQuotationId || ''}
                onChange={(e) => {
                  const quotationId = parseInt(e.target.value);
                  setSelectedQuotationId(quotationId);
                  const quotation = approvedQuotations.find((q) => q.id === quotationId);
                  if (quotation) {
                    setProjectName(quotation.projectName || `Project - ${quotation.quotationNumber}`);
                  }
                }}
                options={[
                  { value: '', label: 'Select a quotation' },
                  ...approvedQuotations.map((quotation) => ({
                    value: quotation.id,
                    label: `${quotation.quotationNumber} - ${quotation.customerName} - ₹${quotation.totalAmount?.toLocaleString('en-IN')}`,
                  }))
                ]}
              />
            </div>

            {/* Quotation Details (if selected) */}
            {selectedQuotation && (
              <Card className="p-4 bg-black-700 border-black-600">
                <h4 className="text-sm font-semibold text-white-800 mb-3">Quotation Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white-600">Customer:</p>
                    <p className="text-white-900 font-medium">{selectedQuotation.customerName}</p>
                  </div>
                  <div>
                    <p className="text-white-600">Total Amount:</p>
                    <p className="text-white-900 font-medium">
                      ₹{selectedQuotation.totalAmount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {selectedQuotation.projectName && (
                    <div className="col-span-2">
                      <p className="text-white-600">Project Name:</p>
                      <p className="text-white-900 font-medium">{selectedQuotation.projectName}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Project Details */}
            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">
                Project Name <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Kitchen Renovation - Apartment 101"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">
                Project Description (Optional)
              </label>
              <TextArea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description..."
                rows={4}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white-700 mb-2">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-700 mb-2">
                  Expected Completion Date
                </label>
                <Input
                  type="date"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            {/* Initial Status */}
            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">
                Initial Status
              </label>
              <Select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: ProjectStatus.ACTIVE, label: 'Active' },
                  { value: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
                ]}
              />
            </div>

            {/* Actions */}
            <div
              className="flex flex-col sm:flex-row justify-end gap-3 pt-4"
              style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[600] || '#374151'}` }}
            >
              <Button
                variant="secondary"
                onClick={() => navigate('/projects')}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConvert}
                disabled={!selectedQuotationId || !projectName || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  'Converting...'
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Convert to Project
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default QuotationConverter;
