import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetCustomerRequirementsQuery,
  useCreateCustomerRequirementsMutation,
  useUpdateCustomerRequirementsMutation,
} from '../customersAPI';
import type { CustomerRequirements, CustomerRequirementsCreate, CustomerRequirementsUpdate } from '../types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';

export interface CustomerRequirementsTabProps {
  customerId: number;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-background-600 rounded-lg mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-background-800 hover:bg-background-700 transition-colors rounded-t-lg"
      >
        <h3 className="text-lg font-semibold text-text-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-600" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

const CheckboxGroup: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-700 bg-background-700 border-background-600 rounded focus:ring-primary-700 focus:ring-2"
      />
      <span className="text-text-700">{label}</span>
    </label>
  );
};

export const CustomerRequirementsTab: React.FC<CustomerRequirementsTabProps> = ({ customerId }) => {
  const { data: requirements, isLoading, error } = useGetCustomerRequirementsQuery(customerId, {
    skip: false,
  });
  const [createRequirements, { isLoading: isCreating }] = useCreateCustomerRequirementsMutation();
  const [updateRequirements, { isLoading: isUpdating }] = useUpdateCustomerRequirementsMutation();

  const [formData, setFormData] = useState<CustomerRequirementsCreate | CustomerRequirementsUpdate>({});

  useEffect(() => {
    if (requirements) {
      // Remove id and customerId from requirements for form data
      const { id, customerId: _, createdAt, updatedAt, ...rest } = requirements;
      setFormData(rest);
    }
  }, [requirements]);

  const handleCheckboxChange = (field: keyof CustomerRequirementsCreate, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: keyof CustomerRequirementsCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (requirements?.id) {
        // Update existing
        await updateRequirements({ customerId, data: formData as CustomerRequirementsUpdate }).unwrap();
        toast.success('Requirements updated successfully');
      } else {
        // Create new
        await createRequirements({ customerId, data: formData as CustomerRequirementsCreate }).unwrap();
        toast.success('Requirements created successfully');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save requirements');
    }
  };

  const handleCancel = () => {
    if (requirements) {
      const { id, customerId: _, createdAt, updatedAt, ...rest } = requirements;
      setFormData(rest);
    } else {
      setFormData({});
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-pulse text-text-600">Loading requirements...</div>
        </div>
      </Card>
    );
  }

  if (error && 'status' in error && error.status === 404) {
    // Requirements don't exist yet, show empty form
  } else if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-error">
          Failed to load requirements. Please try again.
        </div>
      </Card>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-900">Customer Requirements</h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : requirements?.id ? 'Update Requirements' : 'Save Requirements'}
              </Button>
            </div>
          </div>

          {/* 1. Cabinet Type */}
          <CollapsibleSection title="1. Cabinet Type">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="WPC Cabinet"
                checked={formData.cabinetWpc || false}
                onChange={(checked) => handleCheckboxChange('cabinetWpc', checked)}
              />
              <CheckboxGroup
                label="Stainless Steel Cabinet"
                checked={formData.cabinetSs || false}
                onChange={(checked) => handleCheckboxChange('cabinetSs', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 2. Door Material */}
          <CollapsibleSection title="2. Door Material">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="WPC Door"
                checked={formData.doorWpc || false}
                onChange={(checked) => handleCheckboxChange('doorWpc', checked)}
              />
              <CheckboxGroup
                label="Stainless Steel Door"
                checked={formData.doorSs || false}
                onChange={(checked) => handleCheckboxChange('doorSs', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 3. Finish Options */}
          <CollapsibleSection title="3. Finish Options">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="Glax Finish"
                checked={formData.finishGlax || false}
                onChange={(checked) => handleCheckboxChange('finishGlax', checked)}
              />
              <CheckboxGroup
                label="Ceramic Finish"
                checked={formData.finishCeramic || false}
                onChange={(checked) => handleCheckboxChange('finishCeramic', checked)}
              />
              <CheckboxGroup
                label="Glass Finish"
                checked={formData.finishGlass || false}
                onChange={(checked) => handleCheckboxChange('finishGlass', checked)}
              />
              <CheckboxGroup
                label="PU Finish"
                checked={formData.finishPu || false}
                onChange={(checked) => handleCheckboxChange('finishPu', checked)}
              />
              <CheckboxGroup
                label="Laminate Finish"
                checked={formData.finishLaminate || false}
                onChange={(checked) => handleCheckboxChange('finishLaminate', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 4. Layout Options */}
          <CollapsibleSection title="4. Layout Options">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="L-Shape Layout"
                checked={formData.layoutLShape || false}
                onChange={(checked) => handleCheckboxChange('layoutLShape', checked)}
              />
              <CheckboxGroup
                label="U-Shape Layout"
                checked={formData.layoutUShape || false}
                onChange={(checked) => handleCheckboxChange('layoutUShape', checked)}
              />
              <CheckboxGroup
                label="C-Shape Layout"
                checked={formData.layoutCShape || false}
                onChange={(checked) => handleCheckboxChange('layoutCShape', checked)}
              />
              <CheckboxGroup
                label="G-Shape Layout"
                checked={formData.layoutGShape || false}
                onChange={(checked) => handleCheckboxChange('layoutGShape', checked)}
              />
              <CheckboxGroup
                label="Island Layout"
                checked={formData.layoutIsland || false}
                onChange={(checked) => handleCheckboxChange('layoutIsland', checked)}
              />
              <CheckboxGroup
                label="Linear Layout"
                checked={formData.layoutLinear || false}
                onChange={(checked) => handleCheckboxChange('layoutLinear', checked)}
              />
              <CheckboxGroup
                label="Parallel Layout"
                checked={formData.layoutParallel || false}
                onChange={(checked) => handleCheckboxChange('layoutParallel', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 5. Design Features */}
          <CollapsibleSection title="5. Design Features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Island Design"
                checked={formData.designIsland || false}
                onChange={(checked) => handleCheckboxChange('designIsland', checked)}
              />
              <CheckboxGroup
                label="Breakfast Counter"
                checked={formData.designBreakfast || false}
                onChange={(checked) => handleCheckboxChange('designBreakfast', checked)}
              />
              <CheckboxGroup
                label="Bar Unit"
                checked={formData.designBarUnit || false}
                onChange={(checked) => handleCheckboxChange('designBarUnit', checked)}
              />
              <CheckboxGroup
                label="Pantry Unit"
                checked={formData.designPantryUnit || false}
                onChange={(checked) => handleCheckboxChange('designPantryUnit', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 6. Cabinets and Storage */}
          <CollapsibleSection title="6. Cabinets and Storage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Tall Units"
                checked={formData.cabinetTallUnits || false}
                onChange={(checked) => handleCheckboxChange('cabinetTallUnits', checked)}
              />
              <CheckboxGroup
                label="Base Units"
                checked={formData.cabinetBaseUnits || false}
                onChange={(checked) => handleCheckboxChange('cabinetBaseUnits', checked)}
              />
              <CheckboxGroup
                label="Wall Units"
                checked={formData.cabinetWallUnits || false}
                onChange={(checked) => handleCheckboxChange('cabinetWallUnits', checked)}
              />
              <CheckboxGroup
                label="Loft Units"
                checked={formData.cabinetLoftUnits || false}
                onChange={(checked) => handleCheckboxChange('cabinetLoftUnits', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 7. Base Units */}
          <CollapsibleSection title="7. Base Units">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Drawers"
                checked={formData.baseDrawers || false}
                onChange={(checked) => handleCheckboxChange('baseDrawers', checked)}
              />
              <CheckboxGroup
                label="Hinge Doors"
                checked={formData.baseHingeDoors || false}
                onChange={(checked) => handleCheckboxChange('baseHingeDoors', checked)}
              />
              <CheckboxGroup
                label="Pullouts"
                checked={formData.basePullouts || false}
                onChange={(checked) => handleCheckboxChange('basePullouts', checked)}
              />
              <CheckboxGroup
                label="Wicker Basket"
                checked={formData.baseWickerBasket || false}
                onChange={(checked) => handleCheckboxChange('baseWickerBasket', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 8. Wall Unit Options */}
          <CollapsibleSection title="8. Wall Unit Options">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="iMove System"
                checked={formData.wallUnitImove || false}
                onChange={(checked) => handleCheckboxChange('wallUnitImove', checked)}
              />
              <CheckboxGroup
                label="Hinge Doors"
                checked={formData.wallHingeDoors || false}
                onChange={(checked) => handleCheckboxChange('wallHingeDoors', checked)}
              />
              <CheckboxGroup
                label="Bifold Lift-up"
                checked={formData.wallBifoldLiftup || false}
                onChange={(checked) => handleCheckboxChange('wallBifoldLiftup', checked)}
              />
              <CheckboxGroup
                label="Motorised Bifold"
                checked={formData.wallBifoldMotorised || false}
                onChange={(checked) => handleCheckboxChange('wallBifoldMotorised', checked)}
              />
              <CheckboxGroup
                label="Flap-up"
                checked={formData.wallFlapup || false}
                onChange={(checked) => handleCheckboxChange('wallFlapup', checked)}
              />
              <CheckboxGroup
                label="Rolling Shutter"
                checked={formData.wallRollingShutter || false}
                onChange={(checked) => handleCheckboxChange('wallRollingShutter', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 9. Tall Unit Options */}
          <CollapsibleSection title="9. Tall Unit Options">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Pantry Pullout"
                checked={formData.tallUnitPantryPullout || false}
                onChange={(checked) => handleCheckboxChange('tallUnitPantryPullout', checked)}
              />
              <CheckboxGroup
                label="Lavido Pullout"
                checked={formData.lavidoPullout || false}
                onChange={(checked) => handleCheckboxChange('lavidoPullout', checked)}
              />
              <CheckboxGroup
                label="Stainless Steel Shelves"
                checked={formData.tallUnitSsShelves || false}
                onChange={(checked) => handleCheckboxChange('tallUnitSsShelves', checked)}
              />
              <CheckboxGroup
                label="Glass Shelf"
                checked={formData.tallUnitGlassShelf || false}
                onChange={(checked) => handleCheckboxChange('tallUnitGlassShelf', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 10. Handles */}
          <CollapsibleSection title="10. Handles">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="G Handle"
                checked={formData.handleG || false}
                onChange={(checked) => handleCheckboxChange('handleG', checked)}
              />
              <CheckboxGroup
                label="J Handle"
                checked={formData.handleJ || false}
                onChange={(checked) => handleCheckboxChange('handleJ', checked)}
              />
              <CheckboxGroup
                label="Gola Handle"
                checked={formData.handleGola || false}
                onChange={(checked) => handleCheckboxChange('handleGola', checked)}
              />
              <CheckboxGroup
                label="Lip Profile Handle"
                checked={formData.handleLipProfile || false}
                onChange={(checked) => handleCheckboxChange('handleLipProfile', checked)}
              />
              <CheckboxGroup
                label="Expose Handless"
                checked={formData.handleExposeHandless || false}
                onChange={(checked) => handleCheckboxChange('handleExposeHandless', checked)}
              />
              <CheckboxGroup
                label="Inbuilt Handles"
                checked={formData.inbuiltHandles || false}
                onChange={(checked) => handleCheckboxChange('inbuiltHandles', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 11. Handle Colors */}
          <CollapsibleSection title="11. Handle Colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Rose Gold"
                checked={formData.handleColorRoseGold || false}
                onChange={(checked) => handleCheckboxChange('handleColorRoseGold', checked)}
              />
              <CheckboxGroup
                label="Silver"
                checked={formData.handleColorSilver || false}
                onChange={(checked) => handleCheckboxChange('handleColorSilver', checked)}
              />
              <CheckboxGroup
                label="Gold"
                checked={formData.handleColorGold || false}
                onChange={(checked) => handleCheckboxChange('handleColorGold', checked)}
              />
              <CheckboxGroup
                label="Black"
                checked={formData.handleColorBlack || false}
                onChange={(checked) => handleCheckboxChange('handleColorBlack', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 12. Lighting */}
          <CollapsibleSection title="12. Lighting">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Profile Lights"
                checked={formData.profileLights || false}
                onChange={(checked) => handleCheckboxChange('profileLights', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 13. Ovens */}
          <CollapsibleSection title="13. Ovens">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Built-in Oven"
                checked={formData.ovenBuiltIn || false}
                onChange={(checked) => handleCheckboxChange('ovenBuiltIn', checked)}
              />
              <CheckboxGroup
                label="Free Standing Oven"
                checked={formData.ovenFreeStanding || false}
                onChange={(checked) => handleCheckboxChange('ovenFreeStanding', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 14. Refrigerators */}
          <CollapsibleSection title="14. Refrigerators">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Built-in Refrigerator"
                checked={formData.refrigeratorBuiltIn || false}
                onChange={(checked) => handleCheckboxChange('refrigeratorBuiltIn', checked)}
              />
              <CheckboxGroup
                label="Free Standing Refrigerator"
                checked={formData.refrigeratorFreeStanding || false}
                onChange={(checked) => handleCheckboxChange('refrigeratorFreeStanding', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 15. Dishwashers */}
          <CollapsibleSection title="15. Dishwashers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Built-in Dishwasher"
                checked={formData.dishwasherBuiltIn || false}
                onChange={(checked) => handleCheckboxChange('dishwasherBuiltIn', checked)}
              />
              <CheckboxGroup
                label="Free Standing Dishwasher"
                checked={formData.dishwasherFreeStanding || false}
                onChange={(checked) => handleCheckboxChange('dishwasherFreeStanding', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 16. Coffee Makers */}
          <CollapsibleSection title="16. Coffee Makers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Built-in Coffee Maker"
                checked={formData.coffeeMakerBuiltIn || false}
                onChange={(checked) => handleCheckboxChange('coffeeMakerBuiltIn', checked)}
              />
              <CheckboxGroup
                label="Free Standing Coffee Maker"
                checked={formData.coffeeMakerFreeStanding || false}
                onChange={(checked) => handleCheckboxChange('coffeeMakerFreeStanding', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 17. Cook Tops */}
          <CollapsibleSection title="17. Cook Tops">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="90cm Cook Top"
                checked={formData.cookTop90 || false}
                onChange={(checked) => handleCheckboxChange('cookTop90', checked)}
              />
              <CheckboxGroup
                label="60cm Cook Top"
                checked={formData.cookTop60 || false}
                onChange={(checked) => handleCheckboxChange('cookTop60', checked)}
              />
              <CheckboxGroup
                label="120cm Cook Top"
                checked={formData.cookTop120 || false}
                onChange={(checked) => handleCheckboxChange('cookTop120', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 18. Sinks and Faucets */}
          <CollapsibleSection title="18. Sinks and Faucets">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Double Bowl Sink"
                checked={formData.sinkDoubleBowl || false}
                onChange={(checked) => handleCheckboxChange('sinkDoubleBowl', checked)}
              />
              <CheckboxGroup
                label="Single Bowl Sink"
                checked={formData.sinkSingleBowl || false}
                onChange={(checked) => handleCheckboxChange('sinkSingleBowl', checked)}
              />
              <CheckboxGroup
                label="Double Bowl with Drain"
                checked={formData.sinkDoubleWithDrain || false}
                onChange={(checked) => handleCheckboxChange('sinkDoubleWithDrain', checked)}
              />
              <CheckboxGroup
                label="Multifunction Sink"
                checked={formData.sinkMultifunction || false}
                onChange={(checked) => handleCheckboxChange('sinkMultifunction', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 19. Sinks and Faucets Base Unit */}
          <CollapsibleSection title="19. Sinks and Faucets Base Unit">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="Drawers"
                checked={formData.sinkBaseDrawers || false}
                onChange={(checked) => handleCheckboxChange('sinkBaseDrawers', checked)}
              />
              <CheckboxGroup
                label="Doors"
                checked={formData.sinkBaseDoors || false}
                onChange={(checked) => handleCheckboxChange('sinkBaseDoors', checked)}
              />
              <CheckboxGroup
                label="Waste Bin"
                checked={formData.sinkBaseWasteBin || false}
                onChange={(checked) => handleCheckboxChange('sinkBaseWasteBin', checked)}
              />
              <CheckboxGroup
                label="Detergent Holder"
                checked={formData.sinkBaseDetergentHolder || false}
                onChange={(checked) => handleCheckboxChange('sinkBaseDetergentHolder', checked)}
              />
              <CheckboxGroup
                label="Detergent Pullouts"
                checked={formData.sinkBaseDetergentPullouts || false}
                onChange={(checked) => handleCheckboxChange('sinkBaseDetergentPullouts', checked)}
              />
              <CheckboxGroup
                label="Wastebin Pullout"
                checked={formData.sinkBaseWastebinPullout || false}
                onChange={(checked) => handleCheckboxChange('sinkBaseWastebinPullout', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 20. Corner Solutions */}
          <CollapsibleSection title="20. Corner Solutions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="LeMans Corner Solution"
                checked={formData.cornerSolutionLemans || false}
                onChange={(checked) => handleCheckboxChange('cornerSolutionLemans', checked)}
              />
              <CheckboxGroup
                label="Magic Corner Solution"
                checked={formData.cornerSolutionMagicCorner || false}
                onChange={(checked) => handleCheckboxChange('cornerSolutionMagicCorner', checked)}
              />
              <CheckboxGroup
                label="Corner Shelves"
                checked={formData.cornerSolutionShelves || false}
                onChange={(checked) => handleCheckboxChange('cornerSolutionShelves', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 21. Built-in Sinks */}
          <CollapsibleSection title="21. Built-in Sinks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxGroup
                label="Over Counter Sink"
                checked={formData.builtInSinkOverCounter || false}
                onChange={(checked) => handleCheckboxChange('builtInSinkOverCounter', checked)}
              />
              <CheckboxGroup
                label="Under Counter Sink"
                checked={formData.builtInSinkUnderCounter || false}
                onChange={(checked) => handleCheckboxChange('builtInSinkUnderCounter', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 22. Countertops */}
          <CollapsibleSection title="22. Countertops">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="Quartz Countertop"
                checked={formData.countertopQuartz || false}
                onChange={(checked) => handleCheckboxChange('countertopQuartz', checked)}
              />
              <CheckboxGroup
                label="Granite Countertop"
                checked={formData.countertopGranite || false}
                onChange={(checked) => handleCheckboxChange('countertopGranite', checked)}
              />
              <CheckboxGroup
                label="Tiles Countertop"
                checked={formData.countertopTiles || false}
                onChange={(checked) => handleCheckboxChange('countertopTiles', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 23. Timeline */}
          <CollapsibleSection title="23. Timeline">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxGroup
                label="45-60 Days Timeline"
                checked={formData.timeline4560Days || false}
                onChange={(checked) => handleCheckboxChange('timeline4560Days', checked)}
              />
              <CheckboxGroup
                label="60-90 Days Timeline"
                checked={formData.timeline6090Days || false}
                onChange={(checked) => handleCheckboxChange('timeline6090Days', checked)}
              />
              <CheckboxGroup
                label="Above 90 Days Timeline"
                checked={formData.timelineAbove90Days || false}
                onChange={(checked) => handleCheckboxChange('timelineAbove90Days', checked)}
              />
            </div>
          </CollapsibleSection>

          {/* 24. Text Fields */}
          <CollapsibleSection title="24. Additional Information" defaultOpen>
            <div className="space-y-4">
              <TextArea
                label="Aesthetics and Colors"
                value={formData.aestheticsAndColors || ''}
                onChange={(e) => handleTextChange('aestheticsAndColors', e.target.value)}
                placeholder="Enter aesthetics and colors notes..."
                rows={4}
              />
              <TextArea
                label="Interior Designer"
                value={formData.interiorDesigner || ''}
                onChange={(e) => handleTextChange('interiorDesigner', e.target.value)}
                placeholder="Enter interior designer information..."
                rows={3}
              />
              <TextArea
                label="Comments"
                value={formData.comments || ''}
                onChange={(e) => handleTextChange('comments', e.target.value)}
                placeholder="Enter general comments..."
                rows={4}
              />
            </div>
          </CollapsibleSection>
        </div>
      </Card>
    </form>
  );
};

export default CustomerRequirementsTab;

