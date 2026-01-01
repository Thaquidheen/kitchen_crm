/**
 * KitchenScopeForm Component
 * Add scope of work details for a kitchen (key-value pairs)
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { QuotationKitchenScopeDetail } from '@/features/quotations/types';

export interface KitchenScopeFormProps {
  scopeDetails: QuotationKitchenScopeDetail[];
  onScopeDetailsChange: (scopeDetails: QuotationKitchenScopeDetail[]) => void;
}

export function KitchenScopeForm({ scopeDetails, onScopeDetailsChange }: KitchenScopeFormProps) {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleAddScopeDetail = () => {
    if (!newFieldName.trim()) {
      return;
    }

    const newDetail: QuotationKitchenScopeDetail = {
      fieldName: newFieldName.trim(),
      fieldValue: newFieldValue.trim(),
      fieldOrder: scopeDetails.length,
    };

    onScopeDetailsChange([...scopeDetails, newDetail]);
    setNewFieldName('');
    setNewFieldValue('');
  };

  const handleDeleteScopeDetail = (index: number) => {
    const updated = scopeDetails.filter((_, i) => i !== index).map((detail, i) => ({
      ...detail,
      fieldOrder: i,
    }));
    onScopeDetailsChange(updated);
  };

  const handleUpdateScopeDetail = (index: number, field: 'fieldName' | 'fieldValue', value: string) => {
    const updated = [...scopeDetails];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onScopeDetailsChange(updated);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-text-900">Scope of Work</h3>
      </div>

      {/* Add New Scope Detail */}
      <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
          <Input
            type="text"
            placeholder="Field name (e.g., Area, Material, Finish)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddScopeDetail();
              }
            }}
          />
          <Input
            type="text"
            placeholder="Field value/description"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddScopeDetail();
              }
            }}
          />
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleAddScopeDetail} 
          className="w-full sm:w-auto"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Scope Detail
        </Button>
      </Card>

      {/* Scope Details Table */}
      {scopeDetails.length === 0 ? (
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600 text-center">
          <p className="text-xs sm:text-sm text-text-600">No scope details added yet. Add details above.</p>
        </Card>
      ) : (
        <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
          <div className="space-y-2">
            {scopeDetails.map((detail, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-background-700 rounded-lg border border-background-600 hover:border-primary-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-text-600 flex-shrink-0" />
                  <Input
                    type="text"
                    value={detail.fieldName}
                    onChange={(e) => handleUpdateScopeDetail(index, 'fieldName', e.target.value)}
                    className="bg-background-800 border-background-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <TextArea
                    value={detail.fieldValue}
                    onChange={(e) => handleUpdateScopeDetail(index, 'fieldValue', e.target.value)}
                    className="bg-background-800 border-background-600 min-h-[40px]"
                    rows={1}
                  />
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteScopeDetail(index)}
                    icon={<Trash2 className="h-4 w-4 text-error" />}
                    aria-label="Delete scope detail"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default KitchenScopeForm;

