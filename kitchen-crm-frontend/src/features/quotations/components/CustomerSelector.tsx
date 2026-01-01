/**
 * CustomerSelector Component
 * Search and select customer for quotation
 */

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Search, User, Mail, Phone, CheckCircle } from 'lucide-react';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';

export interface CustomerSelectorProps {
  selectedCustomerId?: number;
  onSelect: (customerId: number) => void;
}

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
              className={`p-3 sm:p-4 cursor-pointer transition-all ${
                selectedCustomerId === customer.id
                  ? 'bg-primary-900/20 border-primary-600'
                  : 'bg-background-700 border-background-600 hover:border-primary-700'
              }`}
              onClick={() => onSelect(customer.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background-600 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-text-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-text-900 truncate">{customer.name}</div>
                    <div className="text-xs sm:text-sm text-text-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      {customer.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </span>
                      )}
                      {customer.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {customer.contact}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedCustomerId === customer.id && (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
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
