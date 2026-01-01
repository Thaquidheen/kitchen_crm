/**
 * QuotationStatistics Component
 * Summary cards for quotations KPIs
 */

import { Card } from '@/components/ui/Card';

export interface QuotationStatisticsProps {
  total?: number;
  approved?: number;
  pending?: number;
  rejected?: number;
}

export function QuotationStatistics({ total = 0, approved = 0, pending = 0, rejected = 0 }: QuotationStatisticsProps) {
  const cards = [
    { label: 'Total Quotations', value: total },
    { label: 'Approved', value: approved },
    { label: 'Pending', value: pending },
    { label: 'Rejected', value: rejected },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-3 sm:p-4 bg-background-800 border-background-600">
          <div className="text-xs sm:text-sm text-text-600">{c.label}</div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-text-900">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

export default QuotationStatistics;


