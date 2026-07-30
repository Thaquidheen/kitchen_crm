/**
 * CustomerFormModal
 * HOCH ERP: 580px centered panel over a blurred backdrop, internal scroll,
 * sticky footer (provided by CustomerForm's layout).
 */

import React from 'react';
import { X } from 'lucide-react';
import { CustomerForm } from './CustomerForm';
import type { Customer } from '../types';

export interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: number;
  onSuccess?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess,
}) => {
  const isEdit = typeof customerId === 'number';

  if (!isOpen) return null;

  const handleSuccess = (customer: Customer) => {
    onSuccess?.(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[5px]" aria-hidden="true" />

      {/* Panel */}
      <div className="relative w-[580px] max-w-full max-h-[88vh] flex flex-col bg-background-800 border border-background-600 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-start gap-3 px-6 pt-5 pb-4 border-b border-background-600">
          <div>
            <h2 className="text-[17px] font-[650] text-text-900 m-0">
              {isEdit ? 'Edit Customer' : 'New Customer'}
            </h2>
            <p className="text-[12.5px] text-text-600 mt-1 mb-0">
              Only name and phone are required — the rest can be filled later.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto w-8 h-8 rounded-[9px] flex items-center justify-center text-text-500 hover:bg-background-700 hover:text-text-900 transition-colors shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form (scrollable content + sticky footer inside) */}
        <CustomerForm customerId={customerId} onSuccess={handleSuccess} onCancel={onClose} />
      </div>
    </div>
  );
};

export default CustomerFormModal;
