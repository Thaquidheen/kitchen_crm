import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  Layers,
  Briefcase,
  Palette,
  Package,
  Clock,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Customer } from '../types';
import { useDeleteCustomerMutation, useUpdateCustomerStatusMutation } from '../customersAPI';
import { CustomerOverviewTab } from './CustomerOverviewTab';
import { CustomerPipelineTab } from './CustomerPipelineTab';
import { CustomerQuotationsTab } from './CustomerQuotationsTab';
import { CustomerProjectsTab } from './CustomerProjectsTab';
import { CustomerDesignTab } from './CustomerDesignTab';
import { CustomerProductionTab } from './CustomerProductionTab';
import { CustomerTimelineTab } from './CustomerTimelineTab';
import { CustomerRequirementsTab } from './CustomerRequirementsTab';
import { CustomerWarrantyCardTab } from './CustomerWarrantyCardTab';
import { CustomerFormModal } from './CustomerFormModal';

export interface CustomerDetailProps {
  customer: Customer;
}

type TabType = 'overview' | 'pipeline' | 'quotations' | 'projects' | 'design' | 'production' | 'timeline' | 'requirements' | 'warranty';

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateCustomerStatusMutation();

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'pipeline', label: 'Pipeline', icon: Layers },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'production', label: 'Production', icon: Package },
    { id: 'requirements', label: 'Requirements', icon: ClipboardList },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'warranty', label: 'Warranty Card', icon: ShieldCheck },
  ];

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      return;
    }

    try {
      await deleteCustomer(customer.id).unwrap();
      toast.success('Customer deleted successfully');
      navigate('/customers');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete customer');
    }
  };

  const handleStatusChange = async (newStatus: Customer['status']) => {
    if (newStatus === customer.status) return;

    try {
      await updateStatus({ id: customer.id, status: newStatus }).unwrap();
      toast.success(`Status changed to ${newStatus}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update status');
    }
  };

  const handleContactEmail = () => {
    if (customer.email) {
      window.location.href = `mailto:${customer.email}`;
    } else {
      toast.error('No email address available');
    }
  };

  const handleContactPhone = () => {
    if (customer.contact) {
      window.location.href = `tel:${customer.contact}`;
    } else {
      toast.error('No contact number available');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CustomerOverviewTab customer={customer} onStatusChange={handleStatusChange} />;
      case 'pipeline':
        return <CustomerPipelineTab customerId={customer.id} />;
      case 'quotations':
        return <CustomerQuotationsTab customerId={customer.id} />;
      case 'projects':
        return <CustomerProjectsTab customerId={customer.id} />;
      case 'design':
        return <CustomerDesignTab customerId={customer.id} />;
      case 'production':
        return <CustomerProductionTab customerId={customer.id} />;
      case 'requirements':
        return <CustomerRequirementsTab customerId={customer.id} />;
      case 'timeline':
        return <CustomerTimelineTab customerId={customer.id} />;
      case 'warranty':
        return <CustomerWarrantyCardTab customerId={customer.id} customerName={customer.name} customerEmail={customer.email} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="bg-background-800 border border-background-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
              disabled={isDeleting || isUpdatingStatus}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-error text-error hover:bg-error/20 rounded-md transition-colors"
              disabled={isDeleting || isUpdatingStatus}
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <div className="h-6 w-px bg-background-600"></div>
            <button
              onClick={handleContactEmail}
              className="flex items-center gap-2 px-4 py-2 border border-background-600 text-text-900 hover:bg-background-700 rounded-md transition-colors"
              disabled={!customer.email}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={handleContactPhone}
              className="flex items-center gap-2 px-4 py-2 border border-background-600 text-text-900 hover:bg-background-700 rounded-md transition-colors"
              disabled={!customer.contact}
            >
              <Phone className="w-4 h-4" />
              Call
            </button>
          </div>

          {/* Quick Status Change */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-600">Status:</span>
            <select
              value={customer.status}
              onChange={(e) => handleStatusChange(e.target.value as Customer['status'])}
              className="px-3 py-1.5 rounded-md border border-background-600 bg-background-800 text-text-900 text-sm"
              disabled={isUpdatingStatus}
            >
              <option value="LEAD">LEAD</option>
              <option value="POTENTIAL">POTENTIAL</option>
              <option value="PLANNING">PLANNING</option>
              <option value="CONFIRMED">CONFIRMED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-background-600">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-text-600 hover:text-text-900 border-b-2 border-transparent'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customerId={customer.id}
        onSuccess={() => {
          setIsEditModalOpen(false);
          // The detail view will automatically refresh due to cache invalidation
        }}
      />
    </div>
  );
};

export default CustomerDetail;
