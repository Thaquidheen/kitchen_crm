/**
 * The search box and filters of the Designs page, shared by the work board and the customer
 * designs table. They follow the Customers and Quotations toolbars: a search, a "More Filters"
 * toggle that opens the filters inside the card, a pressed-state toggle like "Starred", and
 * "Clear filters". Everything filters as it is chosen: the data is already on the page.
 */
import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import type { FilterOption } from '../designFilters';

export const SearchBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && value) {
          onChange('');
        }
      }}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-8 w-full pl-8 pr-7 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] text-text-900 outline-none focus:border-primary-600 placeholder:text-text-500"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear the search"
        title="Clear the search"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-text-500 hover:text-text-900 hover:bg-background-700"
      >
        <X size={12} />
      </button>
    )}
  </div>
);

/** "More Filters" / "Hide Filters", with how many are set while the panel is closed. */
export const FiltersToggle: React.FC<{ open: boolean; count: number; onToggle: () => void }> = ({ open, count, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border text-[12.5px] font-medium whitespace-nowrap transition-colors ${
      open ? 'border-primary-600 text-primary-600' : 'border-background-500 text-text-700 hover:bg-background-700 hover:text-text-900'
    }`}
    style={
      open
        ? { background: 'color-mix(in oklab, var(--color-primary-600) 12%, transparent)' }
        : { background: 'var(--color-background-800)' }
    }
  >
    <Filter size={13} />
    <span className="hidden sm:inline">{open ? 'Hide' : 'More'} Filters</span>
    <span className="sm:hidden">Filters</span>
    {count > 0 && !open && (
      <span
        className="ml-0.5 px-1.5 py-px rounded-full text-[10px] font-semibold text-primary-600 tabular-nums"
        style={{ background: 'color-mix(in oklab, var(--color-primary-600) 15%, transparent)' }}
      >
        {count}
      </span>
    )}
  </button>
);

/** An on/off filter in the toolbar, drawn like the Customers page's "Starred". */
export const ToggleFilter: React.FC<{
  pressed: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
}> = ({ pressed, onToggle, icon, label, title }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={pressed}
    title={title}
    className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-[9px] border text-[12.5px] font-medium whitespace-nowrap transition-colors ${
      pressed ? 'text-text-900' : 'text-text-700 hover:text-text-900'
    }`}
    style={
      pressed
        ? {
            borderColor: 'var(--color-primary-600)',
            background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
          }
        : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-900)' }
    }
  >
    {icon}
    {label}
  </button>
);

/** One filter in the "More Filters" panel: a label over a select whose first choice is "all". */
export const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: FilterOption[];
}> = ({ label, value, onChange, allLabel, options }) => (
  <label className="flex flex-col gap-1 w-full sm:w-[190px] min-w-0">
    <span className="text-[11.5px] font-medium text-text-700">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 w-full px-2 rounded-[9px] border bg-background-900 text-[12.5px] text-text-900 outline-none focus:border-primary-600 cursor-pointer ${
        value ? 'border-primary-600' : 'border-background-600'
      }`}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

/** What the list is narrowed by: "Showing x of y", each filter that is set (removable), and "Clear filters". */
export const FilterSummary: React.FC<{
  shown: number;
  total: number;
  noun?: string;
  active: ActiveFilter[];
  onClear: () => void;
}> = ({ shown, total, noun, active, onClear }) => (
  <div className="flex items-center gap-1.5 flex-wrap" role="status">
    <span className="text-[12px] text-text-700 tabular-nums mr-1">
      Showing <span className="font-semibold text-text-900">{shown}</span> of {total}
      {noun ? ` ${noun}` : ''}
    </span>
    {active.map((a) => (
      <span
        key={a.key}
        className="inline-flex items-center gap-1 h-6 pl-2 pr-0.5 rounded-full border border-background-600 bg-background-900 text-[11.5px] font-medium text-text-800 max-w-full"
      >
        <span className="truncate">{a.label}</span>
        <button
          type="button"
          onClick={a.onRemove}
          aria-label={`Remove filter: ${a.label}`}
          title="Remove this filter"
          className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-text-500 hover:text-text-900 hover:bg-background-700"
        >
          <X size={11} />
        </button>
      </span>
    ))}
    <button
      type="button"
      onClick={onClear}
      className="h-6 px-2 rounded-[8px] text-[12px] font-semibold text-primary-600 hover:bg-background-700 whitespace-nowrap"
    >
      Clear filters
    </button>
  </div>
);

/** Nothing passes the search and filters: say so, and offer the way back. */
export const NoMatch: React.FC<{ message: string; onClear: () => void }> = ({ message, onClear }) => (
  <div className="px-5 py-12 text-center">
    <Search size={24} className="mx-auto text-text-500" />
    <div className="text-[14px] font-semibold text-text-900 mt-3">Nothing matches</div>
    <div className="text-[12.5px] text-text-700 mt-1">{message}</div>
    <button
      type="button"
      onClick={onClear}
      className="mt-3.5 px-[13px] py-[7px] rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
    >
      Clear filters
    </button>
  </div>
);
