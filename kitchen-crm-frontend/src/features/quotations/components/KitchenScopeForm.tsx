/**
 * KitchenScopeForm Component
 * Displays predefined scope of work fields for a kitchen with editable values
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { QuotationKitchenScopeDetail } from '@/features/quotations/types';
import { SCOPE_FIELD_NAMES } from '@/features/quotations/types';

export interface KitchenScopeFormProps {
  scopeDetails: QuotationKitchenScopeDetail[];
  onScopeDetailsChange: (scopeDetails: QuotationKitchenScopeDetail[]) => void;
}

export function KitchenScopeForm({ scopeDetails, onScopeDetailsChange }: KitchenScopeFormProps) {
  const handleUpdateFieldValue = (fieldName: string, value: string) => {
    const updated = scopeDetails.map((detail) => {
      if (detail.fieldName === fieldName) {
        return { ...detail, fieldValue: value };
      }
      return detail;
    });
    onScopeDetailsChange(updated);
  };

  // Get value for a specific field name
  const getFieldValue = (fieldName: string): string => {
    const detail = scopeDetails.find((d) => d.fieldName === fieldName);
    return detail?.fieldValue || '';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-text-900">Scope of Work</h3>
      </div>

      <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
        <div className="space-y-3">
          {SCOPE_FIELD_NAMES.map((fieldName, index) => (
            <div
              key={fieldName}
              className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-4 p-2 sm:p-3 bg-background-700 rounded-lg border border-background-600"
            >
              <div className="flex items-center">
                <span className="text-sm font-medium text-text-800">{fieldName}:</span>
              </div>
              <div className="flex items-center">
                <Input
                  type="text"
                  value={getFieldValue(fieldName)}
                  onChange={(e) => handleUpdateFieldValue(fieldName, e.target.value)}
                  placeholder={`Enter ${fieldName.toLowerCase()}`}
                  className="bg-background-800 border-background-600 w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default KitchenScopeForm;
