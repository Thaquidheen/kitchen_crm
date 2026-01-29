/**
 * KitchenScopeForm Component
 * Displays predefined scope of work fields for a kitchen with editable values
 * Also supports custom fields that users can add/remove
 */

import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { QuotationKitchenScopeDetail } from '@/features/quotations/types';
import { SCOPE_FIELD_NAMES } from '@/features/quotations/types';
import { Plus, Trash2 } from 'lucide-react';

export interface KitchenScopeFormProps {
  scopeDetails: QuotationKitchenScopeDetail[];
  onScopeDetailsChange: (scopeDetails: QuotationKitchenScopeDetail[]) => void;
}

export function KitchenScopeForm({ scopeDetails, onScopeDetailsChange }: KitchenScopeFormProps) {
  // Refs for all input fields to enable Enter key navigation
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Separate predefined fields from custom fields
  const predefinedFields = scopeDetails.filter((sd) =>
    SCOPE_FIELD_NAMES.includes(sd.fieldName as typeof SCOPE_FIELD_NAMES[number])
  );
  const customFields = scopeDetails.filter(
    (sd) => !SCOPE_FIELD_NAMES.includes(sd.fieldName as typeof SCOPE_FIELD_NAMES[number])
  );

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = inputRefs.current[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Set ref for an input at a specific index
  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

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

  // Add a new custom field
  const handleAddCustomField = () => {
    const maxOrder = Math.max(...scopeDetails.map((sd) => sd.fieldOrder), 0);
    const newCustomField: QuotationKitchenScopeDetail = {
      fieldName: '',
      fieldValue: '',
      fieldOrder: maxOrder + 1,
    };
    onScopeDetailsChange([...scopeDetails, newCustomField]);
  };

  // Update custom field name
  const handleUpdateCustomFieldName = (index: number, newName: string) => {
    const customFieldIndex = scopeDetails.findIndex(
      (sd, i) =>
        !SCOPE_FIELD_NAMES.includes(sd.fieldName as typeof SCOPE_FIELD_NAMES[number]) &&
        customFields.indexOf(sd) === index
    );
    if (customFieldIndex !== -1) {
      const updated = [...scopeDetails];
      updated[customFieldIndex] = { ...updated[customFieldIndex], fieldName: newName };
      onScopeDetailsChange(updated);
    }
  };

  // Update custom field value
  const handleUpdateCustomFieldValue = (index: number, newValue: string) => {
    const customFieldIndex = scopeDetails.findIndex(
      (sd, i) =>
        !SCOPE_FIELD_NAMES.includes(sd.fieldName as typeof SCOPE_FIELD_NAMES[number]) &&
        customFields.indexOf(sd) === index
    );
    if (customFieldIndex !== -1) {
      const updated = [...scopeDetails];
      updated[customFieldIndex] = { ...updated[customFieldIndex], fieldValue: newValue };
      onScopeDetailsChange(updated);
    }
  };

  // Remove a custom field
  const handleRemoveCustomField = (index: number) => {
    const customFieldToRemove = customFields[index];
    const updated = scopeDetails.filter((sd) => sd !== customFieldToRemove);
    onScopeDetailsChange(updated);
  };

  // Calculate input index for custom fields
  // Predefined fields: 0 to SCOPE_FIELD_NAMES.length - 1
  // Custom field name inputs: SCOPE_FIELD_NAMES.length + (index * 2)
  // Custom field value inputs: SCOPE_FIELD_NAMES.length + (index * 2) + 1
  const getCustomFieldNameIndex = (customIndex: number) => SCOPE_FIELD_NAMES.length + customIndex * 2;
  const getCustomFieldValueIndex = (customIndex: number) => SCOPE_FIELD_NAMES.length + customIndex * 2 + 1;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-text-900">Scope of Work</h3>
      </div>

      <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
        <div className="space-y-3">
          {/* Predefined fields */}
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
                  ref={setInputRef(index)}
                  type="text"
                  value={getFieldValue(fieldName)}
                  onChange={(e) => handleUpdateFieldValue(fieldName, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder={`Enter ${fieldName.toLowerCase()}`}
                  className="bg-background-800 border-background-600 w-full"
                />
              </div>
            </div>
          ))}

          {/* Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="mt-4 pt-4 border-t border-background-600">
              <h4 className="text-sm font-semibold text-text-800 mb-3">Custom Fields</h4>
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div
                    key={`custom-${index}`}
                    className="grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-2 sm:gap-4 p-2 sm:p-3 bg-background-700 rounded-lg border border-background-600"
                  >
                    <div className="flex items-center">
                      <Input
                        ref={setInputRef(getCustomFieldNameIndex(index))}
                        type="text"
                        value={field.fieldName}
                        onChange={(e) => handleUpdateCustomFieldName(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, getCustomFieldNameIndex(index))}
                        placeholder="Field name"
                        className="bg-background-800 border-background-600 w-full text-sm font-medium"
                      />
                    </div>
                    <div className="flex items-center">
                      <Input
                        ref={setInputRef(getCustomFieldValueIndex(index))}
                        type="text"
                        value={field.fieldValue}
                        onChange={(e) => handleUpdateCustomFieldValue(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, getCustomFieldValueIndex(index))}
                        placeholder="Enter value"
                        className="bg-background-800 border-background-600 w-full"
                      />
                    </div>
                    <div className="flex items-center justify-end sm:justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomField(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Field Button */}
          <div className="mt-4 pt-4 border-t border-background-600">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomField}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default KitchenScopeForm;
