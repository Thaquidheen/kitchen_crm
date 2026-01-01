/**
 * Modal Component
 * Dialog/Modal with overlay using Headless UI
 */

import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background-900/75 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full transform overflow-hidden rounded-lg bg-background-800 gradient-card border-2 border-primary-700 p-6 text-left align-middle shadow-xl transition-all',
                  sizeStyles[size]
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-background-600">
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-heading font-semibold text-text-900"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {showCloseButton && (
                      <button
                        type="button"
                        className="text-text-600 hover:text-text-900 transition-colors"
                        onClick={onClose}
                      >
                        <X size={24} />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export const ModalHeader = ({ children, className }: ModalHeaderProps) => {
  return (
    <div className={clsx('mb-4 pb-4 border-b border-background-600', className)}>
      {children}
    </div>
  );
};

export const ModalBody = ({ children, className }: ModalBodyProps) => {
  return <div className={clsx('text-text-700', className)}>{children}</div>;
};

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return (
    <div
      className={clsx(
        'mt-6 pt-4 border-t border-background-600 flex items-center justify-end gap-2',
        className
      )}
    >
      {children}
    </div>
  );
};

// Export all components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
