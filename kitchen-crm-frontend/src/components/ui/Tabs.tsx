/**
 * Tabs Component
 * Tab navigation using Headless UI
 */

import { Fragment, type ReactNode } from 'react';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';

export interface TabItem {
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
}

export const Tabs = ({
  tabs,
  defaultIndex = 0,
  onChange,
  className,
}: TabsProps) => {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List className={clsx('flex space-x-1 rounded-lg bg-background-800 p-1', className)}>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled}
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 px-4 text-sm font-semibold transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 focus:ring-offset-background-900',
                selected
                  ? 'bg-primary-700 text-text-900 shadow-primary'
                  : 'text-text-700 hover:bg-background-700 hover:text-text-900',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              {tab.icon}
              {tab.label}
            </div>
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((tab, index) => (
          <Tab.Panel
            key={index}
            className={clsx(
              'rounded-lg bg-background-800 p-6',
              'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 focus:ring-offset-background-900'
            )}
          >
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs;
