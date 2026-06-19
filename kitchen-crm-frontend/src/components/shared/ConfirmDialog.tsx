/**
 * ConfirmDialog Component
 * Confirmation dialog for destructive actions
 */

import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Modal, ModalBody, ModalFooter, Button } from '../ui';
import type { ButtonVariant } from '../ui/Button';

export type ConfirmDialogType = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /**
   * Optional handler for the footer cancel button. When provided, the cancel
   * button performs this action while the X / backdrop / Esc still call onClose.
   * This lets a 3-choice dialog distinguish a secondary action (cancel button)
   * from dismissing the dialog (X). Defaults to onClose when omitted.
   */
  onCancel?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  isLoading?: boolean;
  confirmVariant?: ButtonVariant;
}

const iconMap = {
  danger: <AlertTriangle size={48} className="text-error" />,
  warning: <AlertTriangle size={48} className="text-warning" />,
  info: <Info size={48} className="text-info" />,
};

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  confirmVariant,
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
  };
  const handleCancel = onCancel ?? onClose;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <ModalBody>
        <div className="flex flex-col items-center text-center gap-4">
          {iconMap[type]}
          <p className="text-text-700">{message}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant || (type === 'danger' ? 'danger' : 'primary')}
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmDialog;
