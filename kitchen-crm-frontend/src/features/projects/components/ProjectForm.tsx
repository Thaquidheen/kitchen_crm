/**
 * ProjectForm Component
 * Form for creating/editing projects
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';
import { useGetQuotationsQuery } from '@/app/baseApi';
import { useCreateProjectMutation, useUpdateProjectMutation } from '../projectsAPI';
import { type Project, type CreateProjectRequest } from '../types';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';

export interface ProjectFormProps {
  project?: Project;
  isEditMode?: boolean;
  initialCustomerId?: number;
}

export function ProjectForm({ project, isEditMode = false, initialCustomerId }: ProjectFormProps) {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [formData, setFormData] = useState<Partial<CreateProjectRequest & { committedInHand?: number; committedInAccount?: number }>>({
    customerId: project?.customerId || initialCustomerId || 0,
    quotationId: project?.quotationId,
    projectName: project?.projectName || '',
    projectDescription: project?.projectDescription || '',
    totalAmount: project?.totalAmount || 0,
    totalTaxAmount: project?.totalTaxAmount || 0,
    committedInHand: project?.committedInHand || 0,
    committedInAccount: project?.committedInAccount || 0,
    startDate: project?.startDate || '',
    expectedCompletionDate: project?.expectedCompletionDate || '',
  });

  const { data: customersData } = useGetCustomersPageQuery({
    page: 0,
    size: 1000,
  });

  // Fetch quotations for the selected customer
  const { data: quotationsData } = useGetQuotationsQuery(
    {
      customerId: formData.customerId || undefined,
      page: 0,
      size: 1000,
    },
    {
      skip: !formData.customerId || formData.customerId === 0,
    }
  );

  // Available quotations (filter out already converted ones, except current project's quotation if editing)
  const availableQuotations = useMemo(() => {
    if (!quotationsData?.content) return [];
    return quotationsData.content.filter((q) => {
      // If editing and this is the current project's quotation, include it
      if (isEditMode && project?.quotationId === q.id) return true;
      // Otherwise, show all quotations (backend will validate if already converted)
      return true;
    });
  }, [quotationsData, isEditMode, project?.quotationId]);

  // Fetch full quotation details when quotationId is selected
  const selectedQuotation = useMemo(() => {
    if (!formData.quotationId || !quotationsData?.content) return null;
    return quotationsData.content.find((q) => q.id === formData.quotationId);
  }, [formData.quotationId, quotationsData]);

  // Auto-populate amounts when quotation is selected
  useEffect(() => {
    if (selectedQuotation && formData.quotationId) {
      setFormData((prev) => ({
        ...prev,
        totalAmount: selectedQuotation.totalAmount || prev.totalAmount,
        // Note: taxAmount is calculated, so we might not have it directly from summary
        // But we can try to infer it or leave it for the backend to populate
      }));
    }
  }, [selectedQuotation, formData.quotationId]);

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!formData.projectName) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      if (isEditMode && project?.id) {
        // Include quotationId in update if provided
        const updateData = {
          ...formData,
          quotationId: formData.quotationId || undefined,
        };
        await updateProject({ id: project.id, ...updateData }).unwrap();
        toast.success('Project updated successfully');
      } else {
        // Don't include committed amounts when creating - they'll be calculated from cash calculation
        const { committedInHand, committedInAccount, ...createData } = formData;
        // Ensure quotationId is included if provided
        const finalCreateData: CreateProjectRequest = {
          ...createData,
          quotationId: createData.quotationId || undefined,
        } as CreateProjectRequest;
        
        await createProject(finalCreateData).unwrap();
        toast.success('Project created successfully');
      }
      navigate('/projects');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error?.data?.message || 'Failed to save project');
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <h2
          className="text-lg sm:text-xl font-bold mb-6"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
        >
          {isEditMode ? 'Edit Project' : 'Create New Project'}
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Customer Selection */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}
            >
              Customer <span style={{ color: currentTheme?.colors?.error || '#dc2626' }}>*</span>
            </label>
            <Select
              value={formData.customerId || ''}
              onChange={(e) => {
                const newCustomerId = parseInt(e.target.value);
                // Reset quotation when customer changes
                setFormData({
                  ...formData,
                  customerId: newCustomerId,
                  quotationId: undefined,
                  totalAmount: 0,
                  totalTaxAmount: 0,
                });
              }}
              required
              options={[
                { value: '', label: 'Select a customer' },
                ...(customersData?.content?.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })) || [])
              ]}
            />
          </div>

          {/* Quotation Selection */}
          {formData.customerId && formData.customerId > 0 && (
            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">
                Quotation (Optional)
              </label>
              <Select
                value={formData.quotationId || ''}
                onChange={(e) => {
                  const quotationId = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData({ ...formData, quotationId });
                }}
                options={[
                  { value: '', label: 'No quotation (manual entry)' },
                  ...(availableQuotations.map((q) => ({
                    value: q.id,
                    label: `${q.quotationNumber} - ₹${q.totalAmount?.toLocaleString('en-IN') || '0'} (${q.status})`,
                  })))
                ]}
              />
              {formData.quotationId && selectedQuotation && (
                <p className="mt-1 text-xs text-white-600">
                  Selected: {selectedQuotation.quotationNumber} - ₹{selectedQuotation.totalAmount?.toLocaleString('en-IN') || '0'}
                </p>
              )}
              {formData.customerId && availableQuotations.length === 0 && (
                <p className="mt-1 text-xs text-white-500">
                  No quotations found for this customer. You can create the project manually.
                </p>
              )}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">
              Project Name <span className="text-red-600">*</span>
            </label>
            <Input
              type="text"
              value={formData.projectName || ''}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              placeholder="e.g., Kitchen Renovation - Apartment 101"
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">
              Description (Optional)
            </label>
            <TextArea
              value={formData.projectDescription || ''}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
              placeholder="Enter project description..."
              rows={4}
            />
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white-700 mb-2">
                  Total Amount (₹) <span className="text-red-600">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, totalAmount: value });
                  }}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-700 mb-2">
                  Total Tax Amount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalTaxAmount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, totalTaxAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Payment Commitment Split - Only show when editing */}
            {isEditMode && (
              <div className="border-t border-black-600 pt-4">
                <h3 className="text-lg font-semibold text-white-900 mb-3">
                  Payment Commitment (How customer will pay)
                </h3>
                <p className="text-sm text-white-600 mb-4">
                  These values are calculated automatically from the Cash Calculation tab. 
                  You can edit them here if needed.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white-700 mb-2">
                      Committed in Hand (Cash) (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.committedInHand || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, committedInHand: value });
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white-700 mb-2">
                      Committed in Account (Bank) (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.committedInAccount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, committedInAccount: value });
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Info message for new projects */}
            {!isEditMode && (
              <div className="border-t border-black-600 pt-4">
                <div className="p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <p className="text-sm text-blue-400">
                    💡 <strong>Note:</strong> Committed cash in hand and cash in account will be calculated automatically 
                    from the Cash Calculation tab after you create the project and associate it with a quotation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white-700 mb-2">
                Expected Completion Date
              </label>
              <Input
                type="date"
                value={formData.expectedCompletionDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, expectedCompletionDate: e.target.value })
                }
              />
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || isUpdating}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating || isUpdating
              ? 'Saving...'
              : isEditMode
              ? 'Update Project'
              : 'Create Project'}
          </Button>
        </div>
      </Card>
    </form>
  );
}

export default ProjectForm;
