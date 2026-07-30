/**
 * KitchenSelector Component
 * Manage multiple kitchens for a quotation
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Edit2, Check, X, Sparkles, Layers } from 'lucide-react';
import type { QuotationKitchenFormData, QuotationElevation } from '@/features/quotations/types';
import { SCOPE_FIELD_NAMES } from '@/features/quotations/types';

export interface KitchenSelectorProps {
  kitchens: QuotationKitchenFormData[];
  onKitchensChange: (kitchens: QuotationKitchenFormData[]) => void;
  suggestedKitchenTypes?: string[];
}

export function KitchenSelector({ kitchens, onKitchensChange, suggestedKitchenTypes = [] }: KitchenSelectorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newKitchenName, setNewKitchenName] = useState('');
  const [expandedKitchenIndex, setExpandedKitchenIndex] = useState<number | null>(null);

  // Helper to add a kitchen with a specific name
  const addKitchenWithName = (name: string) => {
    if (!name.trim()) return;

    // Check if kitchen with this name already exists
    const exists = kitchens.some(
      (k) => k.kitchenName.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) return;

    const newKitchen: QuotationKitchenFormData = {
      kitchenName: name.trim(),
      kitchenOrder: kitchens.length,
      transportationPrice: 0,
      installationPrice: 0,
      scopeDetails: SCOPE_FIELD_NAMES.map((fieldName, index) => ({
        fieldName,
        fieldValue: '',
        fieldOrder: index,
      })),
      planImages: [],
      elevations: [],
      accessories: [],
      cabinets: [],
      doors: [],
      lighting: [],
      // Transportation is a single common charge entered once at the quotation level
      // (see QuotationBuilderPage), so it is NOT a per-kitchen default. Installation stays per-kitchen.
      otherExpenses: [
        { name: 'Installation', amount: 0, isDefault: true },
      ],
    };

    onKitchensChange([...kitchens, newKitchen]);
  };

  const handleAddKitchen = () => {
    if (!newKitchenName.trim()) {
      return;
    }

    addKitchenWithName(newKitchenName);
    setNewKitchenName('');
  };

  // Filter out suggestions that are already added
  const availableSuggestions = suggestedKitchenTypes.filter(
    (type) => !kitchens.some((k) => k.kitchenName.toLowerCase() === type.toLowerCase())
  );

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

  // Get next elevation letter (A, B, C, ...)
  const getNextElevationName = (existingElevations: QuotationElevation[]) => {
    const usedLetters = new Set(existingElevations.map(e => e.name.replace('Elevation ', '')));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of alphabet) {
      if (!usedLetters.has(letter)) {
        return `Elevation ${letter}`;
      }
    }
    return `Elevation ${existingElevations.length + 1}`;
  };

  const handleAddElevation = (kitchenIndex: number) => {
    const updatedKitchens = [...kitchens];
    const kitchen = updatedKitchens[kitchenIndex];
    const elevations = kitchen.elevations || [];

    const newElevation: QuotationElevation = {
      id: Date.now(), // Temporary ID for local state
      name: getNextElevationName(elevations),
      displayOrder: elevations.length,
    };

    updatedKitchens[kitchenIndex] = {
      ...kitchen,
      elevations: [...elevations, newElevation],
    };

    onKitchensChange(updatedKitchens);
  };

  const handleRemoveElevation = (kitchenIndex: number, elevationIndex: number) => {
    const updatedKitchens = [...kitchens];
    const kitchen = updatedKitchens[kitchenIndex];
    const elevations = [...(kitchen.elevations || [])];

    elevations.splice(elevationIndex, 1);
    // Update display order for remaining elevations
    elevations.forEach((el, idx) => {
      el.displayOrder = idx;
    });

    updatedKitchens[kitchenIndex] = {
      ...kitchen,
      elevations,
    };

    onKitchensChange(updatedKitchens);
  };

  const toggleKitchenExpanded = (index: number) => {
    setExpandedKitchenIndex(expandedKitchenIndex === index ? null : index);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Kitchens</h3>
        {/* Editing controls for renaming */}
        {editingIndex !== null && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="Kitchen name"
              value={newKitchenName}
              onChange={(e) => setNewKitchenName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRenameKitchen(editingIndex, newKitchenName);
                }
              }}
              className="w-full sm:w-64"
            />
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
          </div>
        )}
      </div>

      {/* Kitchen Types from Customer - Click to add */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary-600/[0.06] border border-primary-600/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Click to add:</span>
          </div>
          {availableSuggestions.map((type) => (
            <button
              key={type}
              onClick={() => addKitchenWithName(type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-background-800 text-primary-600 hover:bg-primary-600/10 transition-colors border border-primary-600/40"
            >
              <Plus className="h-3 w-3" />
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Manual Add Kitchen Input — always visible */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Enter kitchen name (e.g. Kitchen, Wardrobe, Pantry)"
          value={editingIndex === null ? newKitchenName : ''}
          onChange={(e) => {
            if (editingIndex === null) setNewKitchenName(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && editingIndex === null) handleAddKitchen();
          }}
          disabled={editingIndex !== null}
          className="flex-1"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAddKitchen}
          disabled={!newKitchenName.trim() || editingIndex !== null}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Kitchen
        </Button>
      </div>

      {kitchens.length === 0 ? (
        <div className="p-5 sm:p-6 rounded-xl border border-dashed border-background-500 text-center">
          <p className="text-xs sm:text-sm text-text-600">No kitchens added yet. Use the input above or click a suggested kitchen type to add one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {kitchens.map((kitchen, index) => (
            <Card
              key={index}
              className="p-3 sm:p-4 bg-background-800 border-background-600 rounded-xl hover:border-primary-600/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center text-xs font-semibold text-primary-600 flex-shrink-0">
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
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => toggleKitchenExpanded(index)}>
                      <div className="text-[13px] font-semibold text-text-900 truncate">{kitchen.kitchenName}</div>
                      <div className="text-xs text-text-600 mt-0.5">
                        {(kitchen.elevations || []).length} elevations · {kitchen.scopeDetails.filter(sd => sd.fieldValue.trim()).length}/{kitchen.scopeDetails.length} scope · {kitchen.planImages.length} plan images ·{' '}
                        {kitchen.accessories.length + kitchen.cabinets.length + kitchen.doors.length + kitchen.lighting.length} products
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {editingIndex !== index && (
                    <>
                      <button
                        onClick={() => toggleKitchenExpanded(index)}
                        title="Manage Elevations"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-text-900 hover:bg-background-700 transition-colors"
                      >
                        <Layers className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(index)}
                        title="Rename"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-text-900 hover:bg-background-700 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKitchen(index)}
                        title="Delete kitchen"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Elevations Section - Expanded View */}
              {expandedKitchenIndex === index && (
                <div className="mt-3 pt-3 border-t border-background-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Elevations</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddElevation(index)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Elevation
                    </Button>
                  </div>

                  {(kitchen.elevations || []).length === 0 ? (
                    <p className="text-xs text-text-500 text-center py-2">
                      No elevations added. Click "Add Elevation" to create Elevation A, B, C, etc.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(kitchen.elevations || []).map((elevation, elIndex) => (
                        <div
                          key={elIndex}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-background-700 border border-background-600 rounded-full text-xs"
                        >
                          <span className="text-text-800 font-medium">{elevation.name}</span>
                          <button
                            onClick={() => handleRemoveElevation(index, elIndex)}
                            className="text-text-500 hover:text-error transition-colors"
                            title="Remove elevation"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default KitchenSelector;


