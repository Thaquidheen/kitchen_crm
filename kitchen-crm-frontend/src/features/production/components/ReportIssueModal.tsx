import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateIssueMutation } from '../productionAPI';
import { IssueCategory, IssuePriority } from '../types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
}

const categoryOptions: { value: IssueCategory; label: string }[] = [
  { value: 'MATERIAL_DEFECT', label: 'Material Defect' },
  { value: 'MEASUREMENT_ERROR', label: 'Measurement Error' },
  { value: 'INSTALLATION_DAMAGE', label: 'Installation Damage' },
  { value: 'DELIVERY_DELAY', label: 'Delivery Delay' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'SITE_ISSUE', label: 'Site Issue' },
  { value: 'DESIGN_CHANGE', label: 'Design Change' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-green-500/20 text-green-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-500/20 text-red-400' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  customerId,
}) => {
  const [createIssue, { isLoading }] = useCreateIssueMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as IssueCategory,
    priority: 'MEDIUM' as IssuePriority,
    assignedTo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter an issue title');
      return;
    }

    try {
      const result = await createIssue({
        customerId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        priority: formData.priority,
        assignedTo: formData.assignedTo.trim() || undefined,
      }).unwrap();

      if (result.success) {
        toast.success('Issue reported successfully!');
        handleClose();
      } else {
        toast.error(result.message || 'Failed to report issue');
      }
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      toast.error(error?.data?.message || 'Failed to report issue');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'OTHER',
      priority: 'MEDIUM',
      assignedTo: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background-900 border border-background-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-background-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-text-900">Report Issue</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-background-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 bg-background-800 border border-background-600 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                className="w-full px-3 py-2 bg-background-800 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-text-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                className="w-full px-3 py-2 bg-background-800 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the issue..."
              rows={4}
              className="w-full px-3 py-2 bg-background-800 border border-background-600 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">
              Assign To (Optional)
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="Name of person responsible"
              className="w-full px-3 py-2 bg-background-800 border border-background-600 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-background-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-text-700 hover:text-text-900 hover:bg-background-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-warning hover:bg-warning/90 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Reporting...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
