/**
 * SearchBar Component
 * Reusable search input with debounce
 */

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export const SearchBar = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  className,
}: SearchBarProps) => {
  const [value, setValue] = useState(controlledValue || '');

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    if (onSearch && debounceMs > 0) {
      const timer = setTimeout(() => {
        onSearch(value);
      }, debounceMs);

      return () => clearTimeout(timer);
    } else if (onSearch) {
      onSearch(value);
    }
  }, [value, onSearch, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setValue('');
    onChange?.('');
    onSearch?.('');
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-2 bg-background-700 px-4 py-2.5 rounded-lg border-2 border-background-600 focus-within:border-primary-700 transition-all',
        className
      )}
    >
      <Search size={18} className="text-text-600" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-text-900 placeholder:text-text-600 w-full"
      />
      {value && (
        <button
          onClick={handleClear}
          className="text-text-600 hover:text-text-900 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
