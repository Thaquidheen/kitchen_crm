/**
 * UnsavedChangesDialog Component
 * Shows a confirmation dialog when user tries to leave with unsaved changes
 */

import { Modal, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
}: UnsavedChangesDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Unsaved Changes"
      size="sm"
      closeOnOverlayClick={false}
    >
      <ModalBody>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
          </div>
          <div>
            <p className="text-text-900 font-medium mb-2">
              You have unsaved changes
            </p>
            <p className="text-text-600 text-sm">
              Your quotation has unsaved changes. Would you like to save them before leaving?
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button variant="secondary" onClick={onDiscard} disabled={isSaving}>
          <Trash2 className="h-4 w-4 mr-2" />
          Discard
        </Button>
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default UnsavedChangesDialog;
