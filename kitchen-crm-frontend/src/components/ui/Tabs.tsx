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
      <Tab.List className={clsx('flex gap-1 border-b border-background-600 px-2 overflow-x-auto scrollbar-hide', className)}>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled}
            className={({ selected }) =>
              clsx(
                'whitespace-nowrap px-3.5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                'focus:outline-none',
                selected
                  ? 'border-primary-600 text-text-900'
                  : 'border-transparent text-text-600 hover:text-text-900',
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
            className="rounded-lg bg-background-800 p-4 sm:p-5 focus:outline-none"
          >
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs;
