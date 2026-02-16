/**
 * ProjectCashCalculation Component
 * Calculate and manage cash in hand and cash in account for a project based on quotation
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetProjectCashCalculationQuery, useUpdateProjectCashCalculationMutation, useGetProjectByIdQuery, useUpdateProjectMutation } from '../projectsAPI';
import { type ProjectCashCalculation, type KitchenCashCalculation, type KitchenTaxPercentages } from '../types';
import { Calculator, Save, AlertCircle, Wrench, Package, DoorClosed, Lightbulb, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectCashCalculationProps {
  projectId: number;
}

export function ProjectCashCalculation({ projectId }: ProjectCashCalculationProps) {
  const currentTheme = useAppSelector(selectCurrentTheme);
  const { data: cashData, isLoading, error, refetch } = useGetProjectCashCalculationQuery(projectId, {
    skip: !projectId,
  });
  const { data: projectData, refetch: refetchProject } = useGetProjectByIdQuery(projectId, {
    skip: !projectId,
  });
  const [updateCashCalculation, { isLoading: isUpdating }] = useUpdateProjectCashCalculationMutation();
  const [updateProject, { isLoading: isUpdatingManual }] = useUpdateProjectMutation();

  // Manual entry state for projects without quotation
  const [manualCashInHand, setManualCashInHand] = useState<number>(0);
  const [manualCashInAccount, setManualCashInAccount] = useState<number>(0);

  const [editedTax, setEditedTax] = useState({
    accessories: 0,
    cabinets: 0,
    doors: 0,
    lighting: 0,
  });

  // Per-kitchen tax percentages (for multi-kitchen mode)
  const [kitchenTaxPercentages, setKitchenTaxPercentages] = useState<Record<number, KitchenTaxPercentages>>({});

  // Initialize edited tax percentages from loaded data
  useEffect(() => {
    if (cashData) {
      if (cashData.isMultiKitchen && cashData.kitchens) {
        // Initialize per-kitchen tax percentages
        const kitchenTaxMap: Record<number, KitchenTaxPercentages> = {};
        cashData.kitchens.forEach((kitchen) => {
          kitchenTaxMap[kitchen.kitchenId] = {
            accessoriesTaxPercentage: kitchen.editedAccessoriesTaxPercentage ?? kitchen.accessoriesTaxPercentage ?? 0,
            cabinetsTaxPercentage: kitchen.editedCabinetsTaxPercentage ?? kitchen.cabinetsTaxPercentage ?? 0,
            doorsTaxPercentage: kitchen.editedDoorsTaxPercentage ?? kitchen.doorsTaxPercentage ?? 0,
            lightingTaxPercentage: kitchen.editedLightingTaxPercentage ?? kitchen.lightingTaxPercentage ?? 0,
          };
        });
        setKitchenTaxPercentages(kitchenTaxMap);
        // Also set default tax percentages for fallback
        setEditedTax({
          accessories: cashData.editedAccessoriesTaxPercentage ?? cashData.accessoriesTaxPercentage ?? 0,
          cabinets: cashData.editedCabinetsTaxPercentage ?? cashData.cabinetsTaxPercentage ?? 0,
          doors: cashData.editedDoorsTaxPercentage ?? cashData.doorsTaxPercentage ?? 0,
          lighting: cashData.editedLightingTaxPercentage ?? cashData.lightingTaxPercentage ?? 0,
        });
      } else {
        // Single kitchen mode
        setEditedTax({
          accessories: cashData.editedAccessoriesTaxPercentage ?? cashData.accessoriesTaxPercentage ?? 0,
          cabinets: cashData.editedCabinetsTaxPercentage ?? cashData.cabinetsTaxPercentage ?? 0,
          doors: cashData.editedDoorsTaxPercentage ?? cashData.doorsTaxPercentage ?? 0,
          lighting: cashData.editedLightingTaxPercentage ?? cashData.lightingTaxPercentage ?? 0,
        });
      }
    }
  }, [cashData]);

  // Initialize manual entry values from existing project data
  useEffect(() => {
    if (projectData) {
      setManualCashInHand(projectData.committedInHand || 0);
      setManualCashInAccount(projectData.committedInAccount || 0);
    }
  }, [projectData]);

  const handleManualSave = async () => {
    try {
      const totalAmount = manualCashInHand + manualCashInAccount;
      await updateProject({
        id: projectId,
        committedInHand: manualCashInHand,
        committedInAccount: manualCashInAccount,
        totalAmount: totalAmount,
      }).unwrap();
      toast.success('Cash amounts saved successfully');
      refetchProject();
    } catch (err: any) {
      console.error('Error saving manual cash amounts:', err);
      toast.error(err?.data?.message || 'Failed to save cash amounts');
    }
  };

  // Helper function to calculate category cash
  const calculateCategoryCash = (
    baseAmount: number,
    marginAmount: number,
    originalTaxPercent: number,
    editedTaxPercent: number
  ) => {
    const totalBeforeTax = baseAmount + marginAmount;
    const taxAmount = (totalBeforeTax * editedTaxPercent) / 100;
    const finalAmount = totalBeforeTax + taxAmount;

    // If edited tax is half of original tax, split the category
    const halfOfOriginal = originalTaxPercent / 2;
    const isHalfTax = Math.abs(editedTaxPercent - halfOfOriginal) < 0.01 && originalTaxPercent > 0;

    let cashInHand = 0;
    let cashInAccount = 0;

    if (isHalfTax) {
      // Split: half of (base + margin) to cash in hand, half of (base + margin) + tax to cash in account
      const halfTotalBeforeTax = totalBeforeTax / 2;
      cashInHand = halfTotalBeforeTax;
      cashInAccount = halfTotalBeforeTax + taxAmount;
    } else {
      // Full amount goes to cash in account
      cashInAccount = finalAmount;
    }

    return {
      totalBeforeTax,
      taxAmount,
      finalAmount,
      cashInHand,
      cashInAccount,
      isSplit: isHalfTax,
    };
  };

  // Calculate cash values for kitchens (multi-kitchen mode)
  const kitchenCalculatedValues = useMemo(() => {
    if (!cashData || !cashData.isMultiKitchen || !cashData.kitchens) return null;

    return cashData.kitchens.map((kitchen) => {
      // Get per-kitchen tax percentages or use defaults
      const kitchenTax = kitchenTaxPercentages[kitchen.kitchenId];
      const accessoriesTax = kitchenTax?.accessoriesTaxPercentage ?? editedTax.accessories;
      const cabinetsTax = kitchenTax?.cabinetsTaxPercentage ?? editedTax.cabinets;
      const doorsTax = kitchenTax?.doorsTaxPercentage ?? editedTax.doors;
      const lightingTax = kitchenTax?.lightingTaxPercentage ?? editedTax.lighting;

      const accessories = calculateCategoryCash(
        kitchen.accessoriesBaseTotal,
        kitchen.accessoriesMarginAmount,
        kitchen.accessoriesTaxPercentage,
        accessoriesTax
      );

      const cabinets = calculateCategoryCash(
        kitchen.cabinetsBaseTotal,
        kitchen.cabinetsMarginAmount,
        kitchen.cabinetsTaxPercentage,
        cabinetsTax
      );

      const doors = calculateCategoryCash(
        kitchen.doorsBaseTotal,
        kitchen.doorsMarginAmount,
        kitchen.doorsTaxPercentage,
        doorsTax
      );

      const lighting = calculateCategoryCash(
        kitchen.lightingBaseTotal,
        kitchen.lightingMarginAmount,
        kitchen.lightingTaxPercentage,
        lightingTax
      );

      const kitchenCashInHand = accessories.cashInHand + cabinets.cashInHand + doors.cashInHand + lighting.cashInHand;
      const kitchenCashInAccount = accessories.cashInAccount + cabinets.cashInAccount + doors.cashInAccount + lighting.cashInAccount;

      return {
        kitchen,
        accessories,
        cabinets,
        doors,
        lighting,
        kitchenCashInHand,
        kitchenCashInAccount,
        accessoriesTax,
        cabinetsTax,
        doorsTax,
        lightingTax,
      };
    });
  }, [cashData, editedTax, kitchenTaxPercentages]);

  // Calculate grand totals for multi-kitchen mode
  const grandTotals = useMemo(() => {
    if (!kitchenCalculatedValues) return null;

    const totalCashInHand = kitchenCalculatedValues.reduce((sum, k) => sum + k.kitchenCashInHand, 0) +
      (cashData?.transportationPrice ?? 0) +
      (cashData?.installationPrice ?? 0);
    const totalCashInAccount = kitchenCalculatedValues.reduce((sum, k) => sum + k.kitchenCashInAccount, 0);

    return {
      totalCashInHand,
      totalCashInAccount,
    };
  }, [kitchenCalculatedValues, cashData]);

  // Calculate cash values based on current edited tax percentages (single kitchen mode)
  const calculatedValues = useMemo(() => {
    if (!cashData || cashData.isMultiKitchen) return null;

    const accessories = calculateCategoryCash(
      cashData.accessoriesBaseTotal,
      cashData.accessoriesMarginAmount,
      cashData.accessoriesTaxPercentage,
      editedTax.accessories
    );

    const cabinets = calculateCategoryCash(
      cashData.cabinetsBaseTotal,
      cashData.cabinetsMarginAmount,
      cashData.cabinetsTaxPercentage,
      editedTax.cabinets
    );

    const doors = calculateCategoryCash(
      cashData.doorsBaseTotal,
      cashData.doorsMarginAmount,
      cashData.doorsTaxPercentage,
      editedTax.doors
    );

    const lighting = calculateCategoryCash(
      cashData.lightingBaseTotal,
      cashData.lightingMarginAmount,
      cashData.lightingTaxPercentage,
      editedTax.lighting
    );

    // Calculate totals
    const totalCashInHand =
      accessories.cashInHand +
      cabinets.cashInHand +
      doors.cashInHand +
      lighting.cashInHand +
      (cashData.transportationPrice ?? 0) +
      (cashData.installationPrice ?? 0);

    const totalCashInAccount =
      accessories.cashInAccount +
      cabinets.cashInAccount +
      doors.cashInAccount +
      lighting.cashInAccount;

    return {
      accessories,
      cabinets,
      doors,
      lighting,
      totalCashInHand,
      totalCashInAccount,
    };
  }, [cashData, editedTax]);

  const handleSave = async () => {
    try {
      const request: any = {
        accessoriesTaxPercentage: editedTax.accessories,
        cabinetsTaxPercentage: editedTax.cabinets,
        doorsTaxPercentage: editedTax.doors,
        lightingTaxPercentage: editedTax.lighting,
      };

      // Add per-kitchen tax percentages if in multi-kitchen mode
      if (cashData?.isMultiKitchen && Object.keys(kitchenTaxPercentages).length > 0) {
        request.kitchenTaxPercentages = kitchenTaxPercentages;
      }

      await updateCashCalculation({
        id: projectId,
        request,
      }).unwrap();
      toast.success('Cash calculation saved successfully. Committed amounts have been updated.');
      
      // Refetch project data to show updated committed amounts
      refetchProject();
      // Also refetch cash calculation data to ensure consistency
      refetch();
    } catch (error: any) {
      console.error('Error saving cash calculation:', error);
      toast.error(error?.data?.message || 'Failed to save cash calculation');
    }
  };

  // Check if error is due to missing quotation
  // RTK Query errors can have different structures:
  // - { status: 'CUSTOM_ERROR', data: { message: '...' } }
  // - { status: 'PARSING_ERROR', error: '...' }
  // - { data: { message: '...' } } from the API response
  const errorMessage = error && (
    (error as any)?.data?.message || 
    (error as any)?.error ||
    (error as any)?.message ||
    ''
  );
  const isNoQuotationError = error && typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('quotation');

  if (error && isNoQuotationError) {
    const manualTotal = manualCashInHand + manualCashInAccount;
    return (
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Calculator
            className="h-4 w-4 sm:h-5 sm:w-5"
            style={{ color: currentTheme?.colors?.primary?.[400] || '#818cf8' }}
          />
          <h3
            className="text-base sm:text-lg font-bold"
            style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
          >
            Cash Calculation
          </h3>
        </div>

        <div
          className="mb-4 p-3 rounded border"
          style={{
            backgroundColor: `${currentTheme?.colors?.warning || '#f59e0b'}10`,
            borderColor: `${currentTheme?.colors?.warning || '#f59e0b'}40`
          }}
        >
          <p className="text-xs" style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}>
            No quotation is associated with this project. You can manually enter the committed cash amounts below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              className="block text-xs sm:text-sm mb-1"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Cash In Hand (Committed)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={manualCashInHand || ''}
              onChange={(e) => setManualCashInHand(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              className="block text-xs sm:text-sm mb-1"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Cash In Account (Committed)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={manualCashInAccount || ''}
              onChange={(e) => setManualCashInAccount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div
          className="mb-4 p-3 rounded"
          style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
        >
          <div className="flex justify-between items-center">
            <span
              className="text-sm font-medium"
              style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}
            >
              Total Amount
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {manualTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleManualSave}
            disabled={isUpdatingManual}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdatingManual ? 'Saving...' : 'Save Cash Amounts'}
          </Button>
        </div>
      </Card>
    );
  }

  if (error && !isNoQuotationError) {
    return (
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle
            className="h-5 w-5 flex-shrink-0"
            style={{ color: currentTheme?.colors?.error || '#dc2626' }}
          />
          <p
            className="text-sm break-words"
            style={{ color: currentTheme?.colors?.error || '#dc2626' }}
          >
            Failed to load cash calculation data. {errorMessage || 'An unexpected error occurred.'}
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading || !cashData || (!calculatedValues && !kitchenCalculatedValues)) {
    return (
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <div className="space-y-4">
          <div
            className="h-8 w-64 rounded animate-pulse"
            style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
          />
          <div
            className="h-4 w-48 rounded animate-pulse"
            style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
          />
          <div
            className="h-4 w-40 rounded animate-pulse"
            style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
          />
        </div>
      </Card>
    );
  }

  // Render multi-kitchen mode
  if (cashData.isMultiKitchen && kitchenCalculatedValues && grandTotals) {
    const categories = [
      { label: 'Accessories', icon: Wrench, color: currentTheme?.colors?.primary?.[600] || '#3b82f6' },
      { label: 'Cabinets', icon: Package, color: currentTheme?.colors?.accent?.[500] || '#10b981' },
      { label: 'Doors', icon: DoorClosed, color: currentTheme?.colors?.accent?.[400] || '#a855f7' },
      { label: 'Lighting', icon: Lightbulb, color: currentTheme?.colors?.warning || '#f59e0b' },
    ];

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Calculator
              className="h-5 w-5"
              style={{ color: currentTheme?.colors?.error || '#dc2626' }}
            />
            <h3
              className="text-base sm:text-lg font-bold"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              Cash Calculation
            </h3>
          </div>

          <div
            className="mb-4 p-3 rounded border"
            style={{
              backgroundColor: `${currentTheme?.colors?.primary?.[500] || '#3b82f6'}10`,
              borderColor: currentTheme?.colors?.primary?.[500] || '#3b82f6'
            }}
          >
            <p
              className="text-xs"
              style={{ color: currentTheme?.colors?.primary?.[700] || '#1d4ed8' }}
            >
              <strong>Note:</strong> If the edited tax percentage is half of the original tax (e.g., 9% instead of 18%),
              the category will be split: half of (base + margin) goes to Cash In Hand, half of (base + margin) + tax goes to Cash In Account.
              Transportation and Installation costs are always added to Cash In Hand at the quotation level.
            </p>
          </div>


          {/* Per-Kitchen Calculations */}
          {kitchenCalculatedValues.map((kitchenCalc, index) => {
            const kitchenCategories = [
              {
                label: 'Accessories',
                icon: Wrench,
                color: currentTheme?.colors?.primary?.[600] || '#6366F1',
                calculated: kitchenCalc.accessories,
                baseTotal: kitchenCalc.kitchen.accessoriesBaseTotal,
                marginAmount: kitchenCalc.kitchen.accessoriesMarginAmount,
                originalTax: kitchenCalc.kitchen.accessoriesTaxPercentage,
              },
              {
                label: 'Cabinets',
                icon: Package,
                color: currentTheme?.colors?.accent?.[500] || '#22D3EE',
                calculated: kitchenCalc.cabinets,
                baseTotal: kitchenCalc.kitchen.cabinetsBaseTotal,
                marginAmount: kitchenCalc.kitchen.cabinetsMarginAmount,
                originalTax: kitchenCalc.kitchen.cabinetsTaxPercentage,
              },
              {
                label: 'Doors',
                icon: DoorClosed,
                color: currentTheme?.colors?.primary?.[500] || '#8B5CF6',
                calculated: kitchenCalc.doors,
                baseTotal: kitchenCalc.kitchen.doorsBaseTotal,
                marginAmount: kitchenCalc.kitchen.doorsMarginAmount,
                originalTax: kitchenCalc.kitchen.doorsTaxPercentage,
              },
              {
                label: 'Lighting',
                icon: Lightbulb,
                color: currentTheme?.colors?.semantic?.warning || '#F59E0B',
                calculated: kitchenCalc.lighting,
                baseTotal: kitchenCalc.kitchen.lightingBaseTotal,
                marginAmount: kitchenCalc.kitchen.lightingMarginAmount,
                originalTax: kitchenCalc.kitchen.lightingTaxPercentage,
              },
            ];

            return (
              <Card 
                key={kitchenCalc.kitchen.kitchenId} 
                className="p-4 sm:p-6"
                style={{
                  backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
                  borderColor: currentTheme?.colors?.background?.[600] || '#252530'
                }}
              >
                <h4 
                  className="text-base sm:text-lg font-bold mb-3 sm:mb-4"
                  style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                >
                  Kitchen {kitchenCalc.kitchen.kitchenOrder}: {kitchenCalc.kitchen.kitchenName}
                </h4>

                {/* Per-Kitchen Tax Percentage Inputs */}
                <div 
                  className="mb-4 sm:mb-6 p-3 sm:p-4 rounded"
                  style={{
                    backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24'
                  }}
                >
                  <h5 
                    className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                    style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                  >
                    Tax Percentages (This Kitchen)
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      let taxKey: keyof KitchenTaxPercentages;
                      switch (category.label) {
                        case 'Accessories':
                          taxKey = 'accessoriesTaxPercentage';
                          break;
                        case 'Cabinets':
                          taxKey = 'cabinetsTaxPercentage';
                          break;
                        case 'Doors':
                          taxKey = 'doorsTaxPercentage';
                          break;
                        case 'Lighting':
                          taxKey = 'lightingTaxPercentage';
                          break;
                        default:
                          return null;
                      }
                      const currentTax = kitchenTaxPercentages[kitchenCalc.kitchen.kitchenId]?.[taxKey] ?? 
                        editedTax[category.label.toLowerCase() as keyof typeof editedTax];
                      return (
                        <div key={category.label}>
                          <label 
                            className="block text-xs mb-1 flex items-center gap-1"
                            style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                          >
                            <Icon className="h-3 w-3" style={{ color: category.color }} />
                            {category.label}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={currentTax}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setKitchenTaxPercentages({
                                ...kitchenTaxPercentages,
                                [kitchenCalc.kitchen.kitchenId]: {
                                  ...kitchenTaxPercentages[kitchenCalc.kitchen.kitchenId],
                                  [taxKey]: value,
                                },
                              });
                            }}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Breakdown Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr 
                        className="border-b"
                        style={{ borderColor: currentTheme?.colors?.background?.[600] || '#252530' }}
                      >
                        <th 
                          className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Category
                        </th>
                        <th 
                          className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Base Amount
                        </th>
                        <th 
                          className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Margin
                        </th>
                        <th 
                          className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Original Tax %
                        </th>
                        <th 
                          className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Edited Tax %
                        </th>
                        <th 
                          className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Tax Amount
                        </th>
                        <th 
                          className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                          style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                        >
                          Final Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {kitchenCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <tr 
                            key={category.label} 
                            className="border-b"
                            style={{ borderColor: currentTheme?.colors?.background?.[600] || '#252530' }}
                          >
                            <td className="p-2 sm:p-3">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" style={{ color: category.color }} />
                                <span 
                                  className="font-medium text-xs sm:text-sm"
                                  style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                                >
                                  {category.label}
                                </span>
                                {category.calculated.isSplit && (
                                  <span 
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      color: currentTheme?.colors?.primary?.[400] || '#A78BFA',
                                      backgroundColor: `${currentTheme?.colors?.primary?.[500] || '#8B5CF6'}1A`
                                    }}
                                  >
                                    Split
                                  </span>
                                )}
                              </div>
                            </td>
                            <td 
                              className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                              style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                            >
                              ₹{category.baseTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td 
                              className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
                            >
                              ₹{category.marginAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td 
                              className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
                            >
                              {category.originalTax.toFixed(1)}%
                            </td>
                            <td 
                              className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
                            >
                              {(() => {
                                const taxValue = category.label === 'Accessories' ? kitchenCalc.accessoriesTax :
                                  category.label === 'Cabinets' ? kitchenCalc.cabinetsTax :
                                  category.label === 'Doors' ? kitchenCalc.doorsTax :
                                  kitchenCalc.lightingTax;
                                return typeof taxValue === 'number' ? taxValue.toFixed(1) : '0.0';
                              })()}%
                            </td>
                            <td 
                              className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                              style={{ color: currentTheme?.colors?.semantic?.warning || '#F59E0B' }}
                            >
                              ₹{category.calculated.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td 
                              className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm"
                              style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                            >
                              ₹{category.calculated.finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Kitchen Cash Split Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <Card 
                    className="p-3 sm:p-4"
                    style={{
                      backgroundColor: `${currentTheme?.colors?.semantic?.success || '#10B981'}1A`,
                      borderColor: `${currentTheme?.colors?.semantic?.success || '#10B981'}4D`
                    }}
                  >
                    <h5 
                      className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                      style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                    >
                      Cash In Hand
                    </h5>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {kitchenCategories.map((category) => (
                        <div key={category.label} className="flex justify-between">
                          <span style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}>
                            {category.label}
                          </span>
                          <span 
                            className="font-medium"
                            style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                          >
                            ₹{category.calculated.cashInHand.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div 
                        className="flex justify-between pt-2 mt-2 border-t-2"
                        style={{ borderColor: currentTheme?.colors?.semantic?.success || '#10B981' }}
                      >
                        <span 
                          className="font-bold"
                          style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                        >
                          Kitchen Total
                        </span>
                        <span 
                          className="font-bold text-base sm:text-lg"
                          style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                        >
                          ₹{kitchenCalc.kitchenCashInHand.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card 
                    className="p-3 sm:p-4"
                    style={{
                      backgroundColor: `${currentTheme?.colors?.semantic?.info || '#3B82F6'}1A`,
                      borderColor: `${currentTheme?.colors?.semantic?.info || '#3B82F6'}4D`
                    }}
                  >
                    <h5 
                      className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                      style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                    >
                      Cash In Account
                    </h5>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {kitchenCategories.map((category) => (
                        <div key={category.label} className="flex justify-between">
                          <span style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}>
                            {category.label}
                          </span>
                          <span 
                            className="font-medium"
                            style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                          >
                            ₹{category.calculated.cashInAccount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div 
                        className="flex justify-between pt-2 mt-2 border-t-2"
                        style={{ borderColor: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                      >
                        <span 
                          className="font-bold"
                          style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                        >
                          Kitchen Total
                        </span>
                        <span 
                          className="font-bold text-base sm:text-lg"
                          style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                        >
                          ₹{kitchenCalc.kitchenCashInAccount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            );
          })}

          {/* Grand Total Section */}
          <Card 
            className="p-4 sm:p-6 border-2"
            style={{
              backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
              borderColor: `${currentTheme?.colors?.semantic?.warning || '#F59E0B'}4D`
            }}
          >
            <h4 
              className="text-base sm:text-lg font-bold mb-3 sm:mb-4"
              style={{ color: currentTheme?.colors?.semantic?.warning || '#F59E0B' }}
            >
              Grand Total (All Kitchens)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div 
                className="p-3 sm:p-4 border rounded"
                style={{
                  backgroundColor: `${currentTheme?.colors?.semantic?.success || '#10B981'}1A`,
                  borderColor: `${currentTheme?.colors?.semantic?.success || '#10B981'}4D`
                }}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className="font-bold text-sm sm:text-base"
                    style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                  >
                    Total Cash In Hand
                  </span>
                  <span 
                    className="font-bold text-xl sm:text-2xl"
                    style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                  >
                    ₹{grandTotals.totalCashInHand.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div 
                  className="mt-2 text-xs"
                  style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                >
                  (Includes Transportation: ₹{(cashData.transportationPrice ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  {' + '}
                  Installation: ₹{(cashData.installationPrice ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                </div>
              </div>
              <div 
                className="p-3 sm:p-4 border rounded"
                style={{
                  backgroundColor: `${currentTheme?.colors?.semantic?.info || '#3B82F6'}1A`,
                  borderColor: `${currentTheme?.colors?.semantic?.info || '#3B82F6'}4D`
                }}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className="font-bold text-sm sm:text-base"
                    style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                  >
                    Total Cash In Account
                  </span>
                  <span 
                    className="font-bold text-xl sm:text-2xl"
                    style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                  >
                    ₹{grandTotals.totalCashInAccount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Cash Calculation'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render single kitchen mode (existing logic)
  if (!cashData.isMultiKitchen && calculatedValues) {
    const categories = [
      {
        label: 'Accessories',
        icon: Wrench,
        color: currentTheme?.colors?.primary?.[600] || '#6366F1',
        baseTotal: cashData.accessoriesBaseTotal,
        marginAmount: cashData.accessoriesMarginAmount,
        originalTax: cashData.accessoriesTaxPercentage,
        editedTax: editedTax.accessories,
        calculated: calculatedValues.accessories,
      },
      {
        label: 'Cabinets',
        icon: Package,
        color: currentTheme?.colors?.accent?.[500] || '#22D3EE',
        baseTotal: cashData.cabinetsBaseTotal,
        marginAmount: cashData.cabinetsMarginAmount,
        originalTax: cashData.cabinetsTaxPercentage,
        editedTax: editedTax.cabinets,
        calculated: calculatedValues.cabinets,
      },
      {
        label: 'Doors',
        icon: DoorClosed,
        color: currentTheme?.colors?.primary?.[500] || '#8B5CF6',
        baseTotal: cashData.doorsBaseTotal,
        marginAmount: cashData.doorsMarginAmount,
        originalTax: cashData.doorsTaxPercentage,
        editedTax: editedTax.doors,
        calculated: calculatedValues.doors,
      },
      {
        label: 'Lighting',
        icon: Lightbulb,
        color: currentTheme?.colors?.semantic?.warning || '#F59E0B',
        baseTotal: cashData.lightingBaseTotal,
        marginAmount: cashData.lightingMarginAmount,
        originalTax: cashData.lightingTaxPercentage,
        editedTax: editedTax.lighting,
        calculated: calculatedValues.lighting,
      },
    ];

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Calculator 
              className="h-4 w-4 sm:h-5 sm:w-5" 
              style={{ color: currentTheme?.colors?.semantic?.error || '#EF4444' }} 
            />
            <h3 
              className="text-base sm:text-lg font-bold"
              style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
            >
              Cash Calculation
            </h3>
          </div>

          <div 
            className="mb-4 p-3 rounded border"
            style={{
              backgroundColor: `${currentTheme?.colors?.primary?.[500] || '#8B5CF6'}1A`,
              borderColor: `${currentTheme?.colors?.primary?.[500] || '#8B5CF6'}4D`
            }}
          >
            <p 
              className="text-xs"
              style={{ color: currentTheme?.colors?.primary?.[700] || '#6D28D9' }}
            >
              <strong>Note:</strong> If the edited tax percentage is half of the original tax (e.g., 9% instead of 18%),
              the category will be split: half of (base + margin) goes to Cash In Hand, half of (base + margin) + tax goes to Cash In Account.
              Transportation and Installation costs are always added to Cash In Hand.
            </p>
          </div>

          {/* Category Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr 
                  className="border-b"
                  style={{ borderColor: currentTheme?.colors?.background?.[600] || '#252530' }}
                >
                  <th 
                    className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Category
                  </th>
                  <th 
                    className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Base Amount
                  </th>
                  <th 
                    className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Margin
                  </th>
                  <th 
                    className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Original Tax %
                  </th>
                  <th 
                    className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Edited Tax %
                  </th>
                  <th 
                    className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Tax Amount
                  </th>
                  <th 
                    className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold"
                    style={{ color: currentTheme?.colors?.text?.[800] || '#F5F5F5' }}
                  >
                    Final Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <tr 
                      key={category.label} 
                      className="border-b"
                      style={{ borderColor: currentTheme?.colors?.background?.[600] || '#252530' }}
                    >
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: category.color }} />
                          <span 
                            className="font-medium text-xs sm:text-sm"
                            style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                          >
                            {category.label}
                          </span>
                          {category.calculated.isSplit && (
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                color: currentTheme?.colors?.primary?.[400] || '#A78BFA',
                                backgroundColor: `${currentTheme?.colors?.primary?.[500] || '#8B5CF6'}1A`
                              }}
                            >
                              Split
                            </span>
                          )}
                        </div>
                      </td>
                      <td 
                        className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                        style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                      >
                        ₹{category.baseTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td 
                        className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                        style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
                      >
                        ₹{category.marginAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td 
                        className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                        style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
                      >
                        {category.originalTax.toFixed(1)}%
                      </td>
                      <td className="p-2 sm:p-3 text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={category.editedTax}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            let categoryKey: keyof typeof editedTax;
                            switch (category.label) {
                              case 'Accessories':
                                categoryKey = 'accessories';
                                break;
                              case 'Cabinets':
                                categoryKey = 'cabinets';
                                break;
                              case 'Doors':
                                categoryKey = 'doors';
                                break;
                              case 'Lighting':
                                categoryKey = 'lighting';
                                break;
                              default:
                                return;
                            }
                            setEditedTax({
                              ...editedTax,
                              [categoryKey]: value,
                            });
                          }}
                          className="w-16 sm:w-20 inline-block text-right text-xs sm:text-sm"
                          style={{
                            color: currentTheme?.colors?.text?.[900] || '#FFFFFF',
                            backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24'
                          }}
                        />
                      </td>
                      <td 
                        className="p-2 sm:p-3 text-right text-xs sm:text-sm"
                        style={{ color: currentTheme?.colors?.semantic?.warning || '#F59E0B' }}
                      >
                        ₹{category.calculated.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td 
                        className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm"
                        style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                      >
                        ₹{category.calculated.finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cash Split Breakdown */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Card 
              className="p-3 sm:p-4"
              style={{
                backgroundColor: `${currentTheme?.colors?.semantic?.success || '#10B981'}1A`,
                borderColor: `${currentTheme?.colors?.semantic?.success || '#10B981'}4D`
              }}
            >
              <h4 
                className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
              >
                Cash In Hand Breakdown
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {categories.map((category) => (
                  <div key={category.label} className="flex justify-between">
                    <span style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}>
                      {category.label}
                    </span>
                    <span 
                      className="font-medium"
                      style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                    >
                      ₹{category.calculated.cashInHand.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div 
                  className="flex justify-between pt-2 border-t"
                  style={{ borderColor: currentTheme?.colors?.background?.[600] || '#252530' }}
                >
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}>
                    Transportation
                  </span>
                  <span 
                    className="font-medium"
                    style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                  >
                    ₹{(cashData.transportationPrice ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}>
                    Installation
                  </span>
                  <span 
                    className="font-medium"
                    style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                  >
                    ₹{(cashData.installationPrice ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div 
                  className="flex justify-between pt-2 mt-2 border-t-2"
                  style={{ borderColor: currentTheme?.colors?.semantic?.success || '#10B981' }}
                >
                  <span 
                    className="font-bold"
                    style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                  >
                    Total Cash In Hand
                  </span>
                  <span 
                    className="font-bold text-lg sm:text-xl"
                    style={{ color: currentTheme?.colors?.semantic?.success || '#10B981' }}
                  >
                    ₹{calculatedValues.totalCashInHand.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card>

            <Card 
              className="p-3 sm:p-4"
              style={{
                backgroundColor: `${currentTheme?.colors?.semantic?.info || '#3B82F6'}1A`,
                borderColor: `${currentTheme?.colors?.semantic?.info || '#3B82F6'}4D`
              }}
            >
              <h4 
                className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
              >
                Cash In Account Breakdown
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {categories.map((category) => (
                  <div key={category.label} className="flex justify-between">
                    <span style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}>
                      {category.label}
                    </span>
                    <span 
                      className="font-medium"
                      style={{ color: currentTheme?.colors?.text?.[900] || '#FFFFFF' }}
                    >
                      ₹{category.calculated.cashInAccount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div 
                  className="flex justify-between pt-2 mt-2 border-t-2"
                  style={{ borderColor: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                >
                  <span 
                    className="font-bold"
                    style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                  >
                    Total Cash In Account
                  </span>
                  <span 
                    className="font-bold text-lg sm:text-xl"
                    style={{ color: currentTheme?.colors?.semantic?.info || '#3B82F6' }}
                  >
                    ₹{calculatedValues.totalCashInAccount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-4 sm:mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Cash Calculation'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

export default ProjectCashCalculation;

