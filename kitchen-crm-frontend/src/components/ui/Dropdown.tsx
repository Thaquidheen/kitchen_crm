/**
 * Dropdown Component
 * Dropdown menu using Headless UI
 */

import { Fragment, type ReactNode } from 'react';
import { Menu } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown = ({
  trigger,
  items,
  align = 'right',
  className,
}: DropdownProps) => {
  return (
    <Menu as="div" className={clsx('relative inline-block text-left', className)}>
      <Menu.Button className="w-full">{trigger}</Menu.Button>

      <Menu.Items
        className={clsx(
          'absolute z-10 mt-2 w-56 origin-top-right rounded-lg gradient-card border-2 border-background-600 shadow-lg focus:outline-none',
          'transition-all duration-100 data-[closed]:transform data-[closed]:opacity-0 data-[closed]:scale-95',
          align === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <div className="p-1">
          {items.map((item, index) => (
            <Menu.Item key={index} disabled={item.disabled}>
              {({ focus }) => (
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={clsx(
                    'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    focus && !item.disabled && 'bg-background-700',
                    item.danger
                      ? 'text-error hover:text-error/80'
                      : 'text-text-900',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
};

export default Dropdown;
