import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Calendar,
  Info,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import type { Customer, CustomerStatus } from '../types';
import { leadSourceLabel, isReferralSource } from '../leadSource';

export interface CustomerOverviewTabProps {
  customer: Customer;
  onStatusChange?: (status: CustomerStatus) => void;
}

export const CustomerOverviewTab: React.FC<CustomerOverviewTabProps> = ({ customer }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: CustomerStatus) => {
    const colors = {
      LEAD: 'bg-info/20 text-info border-info',
      POTENTIAL: 'bg-warning/20 text-warning border-warning',
      PLANNING: 'bg-background-500/20 text-text-500 border-background-500',
      CONFIRMED: 'bg-success/20 text-success border-success',
    };
    return colors[status] || colors.LEAD;
  };

  const InfoCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string | undefined;
    isArray?: boolean;
  }> = ({ icon: Icon, label, value, isArray = false }) => (
    <div className="bg-background-800 border border-background-600 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-900/20 rounded-lg">
          <Icon className="w-5 h-5 text-primary-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-600 mb-1">{label}</p>
          {isArray && Array.isArray(value) ? (
            <div className="flex flex-wrap gap-2">
              {value.length > 0 ? (
                value.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-background-700 text-text-900 text-sm rounded"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-text-900">No kitchen types specified</p>
              )}
            </div>
          ) : (
            <p className="text-text-900">{value || 'Not provided'}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-text-600" />
          <span className="text-text-600">Current Status:</span>
        </div>
        <span
          className={`px-3 py-1.5 rounded-lg border font-medium ${getStatusColor(customer.status)}`}
        >
          {customer.status}
        </span>
      </div>

      {/* Basic Information */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={User} label="Full Name" value={customer.name} />
          <InfoCard icon={Mail} label="Email Address" value={customer.email} />
          <InfoCard icon={Phone} label="Contact Number" value={customer.contact} />
          <InfoCard
            icon={CheckCircle}
            label="Customer ID"
            value={`#${customer.id}`}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Address
        </h2>
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <p className="text-text-900 whitespace-pre-wrap">
            {customer.address || 'No address provided'}
          </p>
        </div>
      </div>

      {/* Kitchen Types */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Kitchen Types
        </h2>
        <InfoCard
          icon={Tag}
          label="Interested Kitchen Types"
          value={customer.kitchenTypes || 'Not specified'}
          isArray={false}
        />
      </div>

      {/* Lead Source */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Lead Source
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={UserCheck} label="Source" value={leadSourceLabel(customer.leadSourceType)} />
          {customer.leadSourceType === 'ARCHITECT' && (
            <InfoCard icon={User} label="Architect" value={customer.architectName} />
          )}
          {isReferralSource(customer.leadSourceType) && (
            <>
              <InfoCard icon={User} label="Referrer Name" value={customer.referralName} />
              <InfoCard icon={Phone} label="Referrer Number" value={customer.referralContact} />
              <InfoCard icon={MapPin} label="Referrer Location" value={customer.referralLocation} />
              <InfoCard icon={Tag} label="Referrer Designation" value={customer.referralDesignation} />
            </>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Activity Timeline
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            icon={Calendar}
            label="Created At"
            value={formatDate(customer.createdAt)}
          />
          <InfoCard
            icon={Calendar}
            label="Last Updated"
            value={formatDate(customer.updatedAt)}
          />
        </div>
      </div>

      {/* Summary Stats (Placeholder) */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background-800 border border-background-600 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-text-900 mb-1">0</p>
            <p className="text-sm text-text-600">Quotations</p>
          </div>
          <div className="bg-background-800 border border-background-600 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-text-900 mb-1">0</p>
            <p className="text-sm text-text-600">Projects</p>
          </div>
          <div className="bg-background-800 border border-background-600 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-text-900 mb-1">₹0</p>
            <p className="text-sm text-text-600">Total Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOverviewTab;
