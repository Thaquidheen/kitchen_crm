/**
 * KitchenSelector Component
 * Manage multiple kitchens for a quotation
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { QuotationKitchenFormData } from '@/features/quotations/types';

export interface KitchenSelectorProps {
  kitchens: QuotationKitchenFormData[];
  onKitchensChange: (kitchens: QuotationKitchenFormData[]) => void;
}

export function KitchenSelector({ kitchens, onKitchensChange }: KitchenSelectorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newKitchenName, setNewKitchenName] = useState('');

  const handleAddKitchen = () => {
    if (!newKitchenName.trim()) {
      return;
    }

    const newKitchen: QuotationKitchenFormData = {
      kitchenName: newKitchenName.trim(),
      kitchenOrder: kitchens.length,
      transportationPrice: 0,
      installationPrice: 0,
      scopeDetails: [],
      planImages: [],
      accessories: [],
      cabinets: [],
      doors: [],
      lighting: [],
    };

    onKitchensChange([...kitchens, newKitchen]);
    setNewKitchenName('');
  };

  const handleDeleteKitchen = (index: number) => {
    const updatedKitchens = kitchens.filter((_, i) => i !== index).map((k, i) => ({
      ...k,
      kitchenOrder: i,
    }));
    onKitchensChange(updatedKitchens);
  };

  const handleRenameKitchen = (index: number, newName: string) => {
    if (!newName.trim()) return;
    
    const updatedKitchens = [...kitchens];
    updatedKitchens[index] = {
      ...updatedKitchens[index],
      kitchenName: newName.trim(),
    };
    onKitchensChange(updatedKitchens);
    setEditingIndex(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setNewKitchenName(kitchens[index].kitchenName);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewKitchenName('');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-text-900">Kitchens</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Kitchen name (e.g., OPEN KITCHEN)"
            value={newKitchenName}
            onChange={(e) => setNewKitchenName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && editingIndex === null) {
                handleAddKitchen();
              }
            }}
            className="w-full sm:w-64"
          />
          {editingIndex === null ? (
            <Button variant="primary" size="sm" onClick={handleAddKitchen} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Kitchen
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRenameKitchen(editingIndex, newKitchenName)}
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCancelEdit} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {kitchens.length === 0 ? (
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600 text-center">
          <p className="text-xs sm:text-sm text-text-600">No kitchens added yet. Add your first kitchen above.</p>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {kitchens.map((kitchen, index) => (
            <Card
              key={index}
              className="p-3 sm:p-4 bg-background-800 border-background-600 hover:border-primary-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs sm:text-sm font-semibold text-primary-600 flex-shrink-0">
                    {index + 1}
                  </div>
                  {editingIndex === index ? (
                    <Input
                      type="text"
                      value={newKitchenName}
                      onChange={(e) => setNewKitchenName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameKitchen(index, newKitchenName);
                        }
                      }}
                      className="w-full sm:w-64"
                      autoFocus
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs sm:text-sm text-text-900 truncate">{kitchen.kitchenName}</div>
                      <div className="text-xs sm:text-sm text-text-600">
                        {kitchen.scopeDetails.length} scope items • {kitchen.planImages.length} plan images •{' '}
                        {kitchen.accessories.length + kitchen.cabinets.length + kitchen.doors.length + kitchen.lighting.length} products
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {editingIndex !== index && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(index)}
                        className="p-1 sm:p-2"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKitchen(index)}
                        className="p-1 sm:p-2"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-error" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default KitchenSelector;


