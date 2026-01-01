import React from 'react';
import { Modal } from '../../../components/ui/Modal';
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

  const handleSuccess = (customer: Customer) => {
    onSuccess?.(customer);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Customer' : 'New Customer'}
      size="lg"
      closeOnOverlayClick={false}
    >
      <Modal.Body>
        <CustomerForm
          customerId={customerId}
          showStatusSelector={Boolean(customerId)}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Modal.Body>
    </Modal>
  );
};

export default CustomerFormModal;
