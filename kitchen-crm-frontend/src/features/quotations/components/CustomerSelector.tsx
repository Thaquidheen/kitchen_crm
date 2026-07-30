/**
 * CustomerSelector Component
 * Search and select customer for quotation
 */

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Search, CheckCircle } from 'lucide-react';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';

export interface CustomerSelectorProps {
  selectedCustomerId?: number;
  onSelect: (customerId: number) => void;
}

const initialsOf = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export function CustomerSelector({ selectedCustomerId, onSelect }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useGetCustomersPageQuery({
    name: searchTerm,
    page: 0,
    size: 10,
    sortBy: 'name',
    sortDir: 'asc',
  });

  const customers = data?.content || [];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-600" />
        <Input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-xs sm:text-sm text-text-600 py-6 sm:py-8">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="text-center text-xs sm:text-sm text-text-600 py-6 sm:py-8">
            No customers found. Try a different search term.
          </div>
        ) : (
          customers.map((customer) => (
            <Card
              key={customer.id}
              className={`p-3 cursor-pointer rounded-xl transition-colors ${
                selectedCustomerId === customer.id
                  ? 'bg-primary-600/[0.06] border-primary-600/60'
                  : 'bg-background-800 border-background-600 hover:border-primary-600/50'
              }`}
              onClick={() => onSelect(customer.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-primary-600/10 flex items-center justify-center text-xs font-semibold text-primary-600 flex-shrink-0">
                    {initialsOf(customer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-text-900 truncate">{customer.name}</div>
                    <div className="text-xs text-text-600 truncate mt-0.5">
                      {[customer.contact, customer.email].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                </div>
                {selectedCustomerId === customer.id && (
                  <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CustomerSelector;
