/**
 * QuotationBuilderPage
 * Multi-step quotation builder with customer selection and product selection
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { FileText, ArrowLeft, Save, Send } from 'lucide-react';
import { CustomerSelector } from '@/features/quotations/components/CustomerSelector';
import { ProductSelector } from '@/features/quotations/components/ProductSelector';
import { SelectedProductsList } from '@/features/quotations/components/SelectedProductsList';
import { CategoryPricingPanel } from '@/features/quotations/components/CategoryPricingPanel';
import { CategoryTotals } from '@/features/quotations/components/CategoryTotals';
import { QuotationPreview } from '@/features/quotations/components/QuotationPreview';
import { KitchenSelector } from '@/features/quotations/components/KitchenSelector';
import { KitchenScopeForm } from '@/features/quotations/components/KitchenScopeForm';
import { KitchenPlanImageSelector } from '@/features/quotations/components/KitchenPlanImageSelector';
import { KitchenProductTabs } from '@/features/quotations/components/KitchenProductTabs';
import type { QuotationFormData, CreateQuotationRequest, QuotationAccessory, QuotationCabinet, QuotationDoor, QuotationLighting, QuotationKitchenFormData } from '@/features/quotations/types';
import toast from 'react-hot-toast';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';
import { useCreateQuotationMutation, useUpdateQuotationMutation, useGetQuotationByIdQuery } from '@/features/quotations/quotationsAPI';
import { useGetMarginsQuery } from '@/services/settingsAPI';
import { useParams } from 'react-router-dom';

type BuilderStep = 'customer' | 'kitchens' | 'products' | 'review';

export function QuotationBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Get current user and role from auth state
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.role || 'ROLE_STAFF';

  // Fetch global margin settings
  const { data: marginsResponse, isLoading: isMarginsLoading } = useGetMarginsQuery();

  const [currentStep, setCurrentStep] = useState<BuilderStep>('customer');
  const [formData, setFormData] = useState<Partial<QuotationFormData>>({
    customerId: 0,
    projectName: '',
    transportationPrice: 0,
    installationPrice: 0,
    marginPercentage: 20, // Global (kept for backward compatibility)
    taxPercentage: 18, // Global (kept for backward compatibility)
    // Category-specific rates (will be loaded from system settings)
    accessoriesMarginPercentage: 20,
    cabinetsMarginPercentage: 20,
    doorsMarginPercentage: 20,
    lightingMarginPercentage: 20,
    accessoriesTaxPercentage: 18,
    cabinetsTaxPercentage: 18,
    doorsTaxPercentage: 18,
    lightingTaxPercentage: 18,
    validUntil: '',
    notes: '',
    termsConditions: '',
    accessories: [],
    cabinets: [],
    doors: [],
    lighting: [],
    kitchens: [],
  });

  // Load margins from system settings on mount (only for new quotations, not when editing)
  useEffect(() => {
    if (!isEditMode && marginsResponse?.data) {
      setFormData((prev) => ({
        ...prev,
        accessoriesMarginPercentage: marginsResponse.data.accessories,
        cabinetsMarginPercentage: marginsResponse.data.cabinets,
        doorsMarginPercentage: marginsResponse.data.doors,
        lightingMarginPercentage: marginsResponse.data.lighting,
      }));
    }
  }, [marginsResponse, isEditMode]);

  // Load existing quotation when editing
  const quotationId = isEditMode ? Number(id) : undefined;
  const { data: existingQuotation } = useGetQuotationByIdQuery(quotationId as number, { skip: !isEditMode });

  useEffect(() => {
    if (!isEditMode || !existingQuotation) return;
    // Map API quotation to builder form shape
    setFormData({
      customerId: existingQuotation.customerId,
      projectName: existingQuotation.projectName || '',
      transportationPrice: Number(existingQuotation.transportationPrice || 0),
      installationPrice: Number(existingQuotation.installationPrice || 0),
      marginPercentage: Number(existingQuotation.marginPercentage || 0),
      taxPercentage: Number(existingQuotation.taxPercentage || 0),
      accessoriesMarginPercentage: Number(existingQuotation.accessoriesMarginPercentage || 20),
      cabinetsMarginPercentage: Number(existingQuotation.cabinetsMarginPercentage || 20),
      doorsMarginPercentage: Number(existingQuotation.doorsMarginPercentage || 20),
      lightingMarginPercentage: Number(existingQuotation.lightingMarginPercentage || 20),
      accessoriesTaxPercentage: Number(existingQuotation.accessoriesTaxPercentage || 18),
      cabinetsTaxPercentage: Number(existingQuotation.cabinetsTaxPercentage || 18),
      doorsTaxPercentage: Number(existingQuotation.doorsTaxPercentage || 18),
      lightingTaxPercentage: Number(existingQuotation.lightingTaxPercentage || 18),
      validUntil: existingQuotation.validUntil || '',
      notes: existingQuotation.notes || '',
      termsConditions: existingQuotation.termsConditions || '',
      accessories: (existingQuotation.accessories || []).map((a: any) => ({
        id: a.accessoryId || a.id,
        quantity: a.quantity,
        unitPrice: Number(a.unitPrice || 0),
        totalPrice: Number(a.totalPrice || 0),
        name: a.description || a.accessoryName || 'Accessory',
        description: a.description || a.accessoryName || 'Accessory',
        price: Number(a.unitPrice || 0),
      })),
      cabinets: (existingQuotation.cabinets || []).map((c: any) => ({
        cabinetTypeId: c.cabinetTypeId || c.id,
        widthMm: c.widthMm,
        heightMm: c.heightMm,
        depthMm: c.depthMm,
        calculatedSqft: c.calculatedSqft,
        customDimensions: c.customDimensions,
        quantity: c.quantity,
        unitPrice: Number(c.unitPrice || 0),
        totalPrice: Number(c.totalPrice || 0),
        cabinetTypeName: c.cabinetType?.name || c.description || 'Cabinet',
        description: c.description || `${c.cabinetType?.name || 'Cabinet'} (${c.widthMm}×${c.heightMm}×${c.depthMm}mm)`,
      })),
      doors: (existingQuotation.doors || []).map((d: any) => ({
        doorTypeId: d.doorTypeId || d.id,
        widthMm: d.widthMm,
        heightMm: d.heightMm,
        calculatedSqft: d.calculatedSqft,
        customDimensions: d.customDimensions,
        quantity: d.quantity,
        unitPrice: Number(d.unitPrice || 0),
        totalPrice: Number(d.totalPrice || 0),
        doorTypeName: d.doorType?.name || d.description || 'Door',
        description: d.description || `${d.doorType?.name || 'Door'} (${d.widthMm}×${d.heightMm}mm)`,
      })),
      kitchens: (existingQuotation.kitchens || []).map((k: any) => ({
        kitchenName: k.kitchenName || 'Kitchen',
        kitchenOrder: k.kitchenOrder || 0,
        transportationPrice: Number(k.transportationPrice || 0),
        installationPrice: Number(k.installationPrice || 0),
        scopeDetails: (k.scopeDetails || []).map((sd: any) => ({
          fieldName: sd.fieldName || '',
          fieldValue: sd.fieldValue || '',
          fieldOrder: sd.fieldOrder || 0,
        })),
        planImages: (k.planImages || []).map((pi: any) => ({
          imageName: pi.imageName || '',
          imageUrl: pi.imageUrl || '',
          imageOrder: pi.imageOrder || 0,
          customerPlanImageId: pi.customerPlanImageId,
          designPhaseFileId: pi.designPhaseFileId,
        })),
        accessories: (k.accessories || []).map((a: any) => ({
          id: a.accessoryId || a.id,
          quantity: a.quantity,
          unitPrice: Number(a.unitPrice || 0),
          totalPrice: Number(a.totalPrice || 0),
          name: a.description || a.accessoryName || 'Accessory',
          description: a.description || a.accessoryName || 'Accessory',
          price: Number(a.unitPrice || 0),
        })),
        cabinets: (k.cabinets || []).map((c: any) => ({
          cabinetTypeId: c.cabinetTypeId || c.id,
          widthMm: c.widthMm,
          heightMm: c.heightMm,
          depthMm: c.depthMm,
          calculatedSqft: c.calculatedSqft,
          customDimensions: c.customDimensions,
          quantity: c.quantity,
          unitPrice: Number(c.unitPrice || 0),
          totalPrice: Number(c.totalPrice || 0),
          cabinetTypeName: c.cabinetType?.name || c.description || 'Cabinet',
          description: c.description || `${c.cabinetType?.name || 'Cabinet'} (${c.widthMm}×${c.heightMm}×${c.depthMm}mm)`,
        })),
        doors: (k.doors || []).map((d: any) => ({
          doorTypeId: d.doorTypeId || d.id,
          widthMm: d.widthMm,
          heightMm: d.heightMm,
          calculatedSqft: d.calculatedSqft,
          customDimensions: d.customDimensions,
          quantity: d.quantity,
          unitPrice: Number(d.unitPrice || 0),
          totalPrice: Number(d.totalPrice || 0),
          doorTypeName: d.doorType?.name || d.description || 'Door',
          description: d.description || `${d.doorType?.name || 'Door'} (${d.widthMm}×${d.heightMm}mm)`,
        })),
        lighting: (k.lighting || []).map((l: any) => {
          const itemType = l.itemType || 'LIGHT_PROFILE';
          let displayName = l.itemName || l.description || 'Lighting Item';
          return {
            id: l.itemId || l.id,
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice || 0),
            totalPrice: Number(l.totalPrice || 0),
            name: displayName,
            description: displayName,
            itemType: itemType,
          };
        }),
      })),
      lighting: (existingQuotation.lighting || []).map((l: any) => {
        // Try to reconstruct the itemType from the description or fallback to itemType
        const itemType = l.itemType || 'LIGHT_PROFILE';
        // Use itemName from backend (e.g., "Driver - 20W", "Light Profile - Type A")
        // Fall back to description if itemName is not available
        let displayName = l.itemName || l.description || 'Lighting Item';

        return {
          id: l.itemId || l.id,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice || 0),
          totalPrice: Number(l.totalPrice || 0),
          name: displayName,
          description: displayName,
          itemType: itemType,
        };
      }),
    });
  }, [isEditMode, existingQuotation]);

  // API mutations
  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateQuotationMutation();

  // Fetch customer details for preview
  const { data: customersData } = useGetCustomersPageQuery({
    page: 0,
    size: 1000,
  });

  const selectedCustomer = customersData?.content?.find(
    (c) => c.id === formData.customerId
  );

  // Calculate products subtotal
  const productsSubtotal =
    [...(formData.accessories || []), ...(formData.cabinets || []), ...(formData.doors || []), ...(formData.lighting || [])].reduce(
      (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
      0
    );

  // Helper function to convert form data to API request format
  const convertFormDataToRequest = (isDraft: boolean): CreateQuotationRequest => {
    return {
      customerId: formData.customerId || 0,
      projectName: formData.projectName || undefined,
      transportationPrice: formData.transportationPrice || 0,
      installationPrice: formData.installationPrice || 0,
      marginPercentage: formData.marginPercentage || 0, // Global (backward compatibility)
      taxPercentage: formData.taxPercentage || 0, // Global (backward compatibility)
      // Category-specific rates
      accessoriesMarginPercentage: formData.accessoriesMarginPercentage || 20,
      cabinetsMarginPercentage: formData.cabinetsMarginPercentage || 20,
      doorsMarginPercentage: formData.doorsMarginPercentage || 20,
      lightingMarginPercentage: formData.lightingMarginPercentage || 20,
      accessoriesTaxPercentage: formData.accessoriesTaxPercentage || 18,
      cabinetsTaxPercentage: formData.cabinetsTaxPercentage || 18,
      doorsTaxPercentage: formData.doorsTaxPercentage || 18,
      lightingTaxPercentage: formData.lightingTaxPercentage || 18,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes || undefined,
      termsConditions: formData.termsConditions || undefined,
      accessories: (formData.accessories || []).map((item: any) => ({
        accessoryId: item.id,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.name,
      })) as QuotationAccessory[],
      cabinets: (formData.cabinets || []).map((item: any) => ({
        cabinetTypeId: item.cabinetTypeId || item.id,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.cabinetTypeName || item.name,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        depthMm: item.depthMm,
        calculatedSqft: item.calculatedSqft,
        customDimensions: item.customDimensions,
      })) as QuotationCabinet[],
      doors: (formData.doors || []).map((item: any) => ({
        doorTypeId: item.doorTypeId || item.id,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.doorTypeName || item.name,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        calculatedSqft: item.calculatedSqft,
        customDimensions: item.customDimensions,
      })) as QuotationDoor[],
      lighting: (formData.lighting || []).map((item: any) => ({
        itemType: (item.itemType || 'LIGHT_PROFILE') as any,
        itemId: item.id || 0,
        quantity: item.quantity || 1,
        unitPrice: item.price || item.unitPrice || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.name || item.description || 'Lighting Item',
      })) as QuotationLighting[],
      kitchens: (formData.kitchens || []).map((kitchen: QuotationKitchenFormData) => ({
        kitchenName: kitchen.kitchenName,
        kitchenOrder: kitchen.kitchenOrder,
        transportationPrice: kitchen.transportationPrice || 0,
        installationPrice: kitchen.installationPrice || 0,
        scopeDetails: kitchen.scopeDetails.map((sd) => ({
          fieldName: sd.fieldName,
          fieldValue: sd.fieldValue,
          fieldOrder: sd.fieldOrder,
        })),
        planImages: kitchen.planImages.map((pi) => ({
          imageName: pi.imageName,
          imageUrl: pi.imageUrl,
          imageOrder: pi.imageOrder,
          customerPlanImageId: pi.customerPlanImageId,
          designPhaseFileId: pi.designPhaseFileId,
        })),
        accessories: kitchen.accessories.map((item: any) => ({
          accessoryId: item.id,
          quantity: item.quantity || 1,
          unitPrice: item.price || item.unitPrice || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.name,
        })),
        cabinets: kitchen.cabinets.map((item: any) => ({
          cabinetTypeId: item.cabinetTypeId || item.id,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.cabinetTypeName || item.name,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          depthMm: item.depthMm,
          calculatedSqft: item.calculatedSqft,
          customDimensions: item.customDimensions,
        })),
        doors: kitchen.doors.map((item: any) => ({
          doorTypeId: item.doorTypeId || item.id,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.doorTypeName || item.name,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          calculatedSqft: item.calculatedSqft,
          customDimensions: item.customDimensions,
        })),
        lighting: kitchen.lighting.map((item: any) => ({
          itemType: (item.itemType || 'LIGHT_PROFILE') as any,
          itemId: item.id || 0,
          quantity: item.quantity || 1,
          unitPrice: item.price || item.unitPrice || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.name || item.description || 'Lighting Item',
        })),
      })),
    };
  };

  // Validate form data
  const validateFormData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.customerId) {
      errors.push('Please select a customer');
    }

    // Check for products - either in kitchens or globally (backward compatibility)
    const hasKitchens = formData.kitchens && formData.kitchens.length > 0;
    
    let hasProducts = false;
    
    if (hasKitchens) {
      // Check if at least one kitchen has at least one product
      hasProducts = formData.kitchens.some((kitchen) => {
        const kitchenHasProducts =
          (kitchen.accessories?.length || 0) > 0 ||
          (kitchen.cabinets?.length || 0) > 0 ||
          (kitchen.doors?.length || 0) > 0 ||
          (kitchen.lighting?.length || 0) > 0;
        return kitchenHasProducts;
      });
    } else {
      // Backward compatibility: check global product arrays
      hasProducts =
        (formData.accessories?.length || 0) > 0 ||
        (formData.cabinets?.length || 0) > 0 ||
        (formData.doors?.length || 0) > 0 ||
        (formData.lighting?.length || 0) > 0;
    }

    if (!hasProducts) {
      errors.push('Please add at least one product');
    }

    if (formData.validUntil) {
      const validDate = new Date(formData.validUntil);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (validDate < today) {
        errors.push('Validity date must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleCustomerSelect = (customerId: number) => {
    setFormData({ ...formData, customerId });
  };

  const handleNext = () => {
    if (currentStep === 'customer') {
      if (!formData.customerId) {
        toast.error('Please select a customer');
        return;
      }
      setCurrentStep('kitchens');
    } else if (currentStep === 'kitchens') {
      // If no kitchens added, skip to products (backward compatibility)
      if ((formData.kitchens?.length || 0) === 0) {
        setCurrentStep('products');
      } else {
        // Validate kitchens have required data
        const hasInvalidKitchen = formData.kitchens?.some(
          (k) => !k.kitchenName || k.scopeDetails.length === 0 || k.planImages.length === 0
        );
        if (hasInvalidKitchen) {
          toast.error('Please complete all kitchen details (name, scope, and at least one plan image)');
          return;
        }
        setCurrentStep('products');
      }
    } else if (currentStep === 'products') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'products') {
      setCurrentStep('kitchens');
    } else if (currentStep === 'kitchens') {
      setCurrentStep('customer');
    } else if (currentStep === 'review') {
      setCurrentStep('products');
    }
  };

  const handleSaveDraft = async () => {
    const validation = validateFormData();

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    try {
      const requestData = convertFormDataToRequest(true);

      if (isEditMode && id) {
        await updateQuotation({ id: parseInt(id), ...requestData }).unwrap();
        toast.success('Quotation draft updated successfully');
      } else {
        await createQuotation(requestData).unwrap();
        toast.success('Quotation draft saved successfully');
      }

      navigate('/quotations');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error(error?.data?.message || 'Failed to save quotation draft');
    }
  };

  const handleSubmit = async () => {
    const validation = validateFormData();

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    try {
      const requestData = convertFormDataToRequest(false);

      if (isEditMode && id) {
        await updateQuotation({ id: parseInt(id), ...requestData }).unwrap();
        toast.success('Quotation updated and sent successfully');
      } else {
        const result = await createQuotation(requestData).unwrap();
        toast.success('Quotation created and sent successfully');
      }

      navigate('/quotations');
    } catch (error: any) {
      console.error('Error submitting quotation:', error);
      toast.error(error?.data?.message || 'Failed to submit quotation');
    }
  };

  const steps = [
    { id: 'customer', label: 'Customer', completed: !!formData.customerId },
    { id: 'kitchens', label: 'Kitchens', completed: (formData.kitchens?.length || 0) > 0 },
    { id: 'products', label: 'Products', completed: false },
    { id: 'review', label: 'Review', completed: false },
  ];

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')} className="hidden sm:flex">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-900">{isEditMode ? 'Edit Quotation' : 'New Quotation'}</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">
                {isEditMode ? 'Update the existing quotation' : 'Create a new quotation'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSaveDraft} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Draft</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} className="w-full sm:w-auto">
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-max">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === step.id
                        ? 'bg-primary-600 text-text-900'
                        : step.completed
                        ? 'bg-success text-text-900'
                        : 'bg-background-700 text-text-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      currentStep === step.id ? 'text-text-900' : 'text-text-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 sm:w-16 h-0.5 bg-background-600 mx-2 sm:mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            {currentStep === 'customer' && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Select Customer</h2>
                <CustomerSelector
                  selectedCustomerId={formData.customerId}
                  onSelect={handleCustomerSelect}
                />
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto">
                    Next: Add Kitchens
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'kitchens' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Add Kitchens</h2>
                <p className="text-xs sm:text-sm text-text-600 mb-4">
                  Add one or more kitchens to this quotation. Each kitchen can have its own scope of work, plan images, and products.
                </p>

                <KitchenSelector
                  kitchens={formData.kitchens || []}
                  onKitchensChange={(kitchens) => setFormData({ ...formData, kitchens })}
                />

                {/* Kitchen Details */}
                {formData.kitchens && formData.kitchens.length > 0 && (
                  <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    {formData.kitchens.map((kitchen, kitchenIndex) => (
                      <Card key={kitchenIndex} className="p-4 sm:p-6 bg-background-800 border-background-600">
                        <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-4">
                          {kitchen.kitchenName}
                        </h3>

                        <div className="space-y-6">
                          {/* Scope of Work */}
                          <div>
                            <KitchenScopeForm
                              scopeDetails={kitchen.scopeDetails}
                              onScopeDetailsChange={(scopeDetails) => {
                                const updatedKitchens = [...(formData.kitchens || [])];
                                updatedKitchens[kitchenIndex] = {
                                  ...updatedKitchens[kitchenIndex],
                                  scopeDetails,
                                };
                                setFormData({ ...formData, kitchens: updatedKitchens });
                              }}
                            />
                          </div>

                          {/* Plan Images */}
                          <div>
                            <KitchenPlanImageSelector
                              customerId={formData.customerId || 0}
                              selectedPlanImages={kitchen.planImages}
                              onPlanImagesChange={(planImages) => {
                                const updatedKitchens = [...(formData.kitchens || [])];
                                updatedKitchens[kitchenIndex] = {
                                  ...updatedKitchens[kitchenIndex],
                                  planImages,
                                };
                                setFormData({ ...formData, kitchens: updatedKitchens });
                              }}
                            />
                          </div>

                          {/* Transportation and Installation are set at quotation level, not per kitchen */}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2">
                  <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto">
                    {formData.kitchens && formData.kitchens.length > 0
                      ? 'Next: Add Products'
                      : 'Skip: Add Products'}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'products' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Add Products</h2>
                
                {/* Check if kitchens exist - if yes, show KitchenProductTabs, otherwise show global product selection */}
                {formData.kitchens && formData.kitchens.length > 0 ? (
                  <>
                    <KitchenProductTabs
                      kitchens={formData.kitchens}
                      onKitchensChange={(kitchens) => setFormData({ ...formData, kitchens })}
                      accessoriesMarginPercentage={formData.accessoriesMarginPercentage || 20}
                      cabinetsMarginPercentage={formData.cabinetsMarginPercentage || 20}
                      doorsMarginPercentage={formData.doorsMarginPercentage || 20}
                      lightingMarginPercentage={formData.lightingMarginPercentage || 20}
                      accessoriesTaxPercentage={formData.accessoriesTaxPercentage || 18}
                      cabinetsTaxPercentage={formData.cabinetsTaxPercentage || 18}
                      doorsTaxPercentage={formData.doorsTaxPercentage || 18}
                      lightingTaxPercentage={formData.lightingTaxPercentage || 18}
                      userRole={userRole}
                      onAccessoriesTaxChange={(val) => setFormData({ ...formData, accessoriesTaxPercentage: val })}
                      onCabinetsTaxChange={(val) => setFormData({ ...formData, cabinetsTaxPercentage: val })}
                      onDoorsTaxChange={(val) => setFormData({ ...formData, doorsTaxPercentage: val })}
                      onLightingTaxChange={(val) => setFormData({ ...formData, lightingTaxPercentage: val })}
                      onAccessoriesMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, accessoriesMarginPercentage: val }) : undefined}
                      onCabinetsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, cabinetsMarginPercentage: val }) : undefined}
                      onDoorsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, doorsMarginPercentage: val }) : undefined}
                      onLightingMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, lightingMarginPercentage: val }) : undefined}
                    />
                  </>
                ) : (
                  <>
                    <ProductSelector
                      selectedProducts={{
                        accessories: formData.accessories || [],
                        cabinets: formData.cabinets || [],
                        doors: formData.doors || [],
                        lighting: formData.lighting || [],
                      }}
                      onProductsChange={(products) => setFormData({ ...formData, ...products })}
                    />

                    {/* Category Pricing Panel */}
                    <div className="mt-6">
                      <CategoryPricingPanel
                        accessories={formData.accessories || []}
                        cabinets={formData.cabinets || []}
                        doors={formData.doors || []}
                        lighting={formData.lighting || []}
                        transportationPrice={formData.transportationPrice || 0}
                        installationPrice={formData.installationPrice || 0}
                        accessoriesMargin={formData.accessoriesMarginPercentage || 20}
                        cabinetsMargin={formData.cabinetsMarginPercentage || 20}
                        doorsMargin={formData.doorsMarginPercentage || 20}
                        lightingMargin={formData.lightingMarginPercentage || 20}
                        accessoriesTax={formData.accessoriesTaxPercentage || 18}
                        cabinetsTax={formData.cabinetsTaxPercentage || 18}
                        doorsTax={formData.doorsTaxPercentage || 18}
                        lightingTax={formData.lightingTaxPercentage || 18}
                        onTransportationChange={(val) =>
                          setFormData({ ...formData, transportationPrice: val })
                        }
                        onInstallationChange={(val) =>
                          setFormData({ ...formData, installationPrice: val })
                        }
                        onAccessoriesTaxChange={(val) => setFormData({ ...formData, accessoriesTaxPercentage: val })}
                        onCabinetsTaxChange={(val) => setFormData({ ...formData, cabinetsTaxPercentage: val })}
                        onDoorsTaxChange={(val) => setFormData({ ...formData, doorsTaxPercentage: val })}
                        onLightingTaxChange={(val) => setFormData({ ...formData, lightingTaxPercentage: val })}
                        onAccessoriesMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, accessoriesMarginPercentage: val }) : undefined}
                        onCabinetsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, cabinetsMarginPercentage: val }) : undefined}
                        onDoorsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, doorsMarginPercentage: val }) : undefined}
                        onLightingMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, lightingMarginPercentage: val }) : undefined}
                        userRole={userRole}
                      />
                    </div>

                    {/* Category Totals */}
                    <div className="mt-6">
                      <CategoryTotals
                        accessories={formData.accessories || []}
                        cabinets={formData.cabinets || []}
                        doors={formData.doors || []}
                        lighting={formData.lighting || []}
                        accessoriesMarginPercentage={formData.accessoriesMarginPercentage || 20}
                        cabinetsMarginPercentage={formData.cabinetsMarginPercentage || 20}
                        doorsMarginPercentage={formData.doorsMarginPercentage || 20}
                        lightingMarginPercentage={formData.lightingMarginPercentage || 20}
                        accessoriesTaxPercentage={formData.accessoriesTaxPercentage || 18}
                        cabinetsTaxPercentage={formData.cabinetsTaxPercentage || 18}
                        doorsTaxPercentage={formData.doorsTaxPercentage || 18}
                        lightingTaxPercentage={formData.lightingTaxPercentage || 18}
                      />
                    </div>
                  </>
                )}

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2">
                  <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto">
                    Next: Review
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Review & Finalize Quotation</h2>

                {/* Quotation Details */}
                <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-4">Quotation Details</h3>
                  <div className="space-y-4">
                    {/* Project Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Project Name (Optional)
                      </label>
                      <Input
                        type="text"
                        value={formData.projectName || ''}
                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                        placeholder="e.g., Kitchen Renovation - Apartment 101"
                      />
                    </div>

                    {/* Validity Date */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Valid Until
                      </label>
                      <Input
                        type="date"
                        value={formData.validUntil || ''}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Notes (Optional)
                      </label>
                      <TextArea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any additional notes or special instructions..."
                        rows={4}
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Terms & Conditions (Optional)
                      </label>
                      <TextArea
                        value={formData.termsConditions || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, termsConditions: e.target.value })
                        }
                        placeholder="Enter terms and conditions..."
                        rows={6}
                      />
                    </div>
                  </div>
                </Card>

                {/* Preview */}
                <QuotationPreview
                  customer={selectedCustomer}
                  accessories={formData.accessories || []}
                  cabinets={formData.cabinets || []}
                  doors={formData.doors || []}
                  lighting={formData.lighting || []}
                  transportationPrice={formData.transportationPrice || 0}
                  installationPrice={formData.installationPrice || 0}
                  accessoriesMarginPercentage={formData.accessoriesMarginPercentage || 20}
                  cabinetsMarginPercentage={formData.cabinetsMarginPercentage || 20}
                  doorsMarginPercentage={formData.doorsMarginPercentage || 20}
                  lightingMarginPercentage={formData.lightingMarginPercentage || 20}
                  accessoriesTaxPercentage={formData.accessoriesTaxPercentage || 18}
                  cabinetsTaxPercentage={formData.cabinetsTaxPercentage || 18}
                  doorsTaxPercentage={formData.doorsTaxPercentage || 18}
                  lightingTaxPercentage={formData.lightingTaxPercentage || 18}
                  kitchens={formData.kitchens}
                />

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2">
                  <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      onClick={handleSaveDraft}
                      disabled={isCreating || isUpdating}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isCreating || isUpdating ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={isCreating || isUpdating}
                      className="w-full sm:w-auto"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isCreating || isUpdating ? 'Submitting...' : 'Submit Quotation'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Selected Products Summary */}
        <div className="lg:col-span-1">
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            <h3 className="text-base sm:text-lg font-bold text-text-900 mb-4">Selected Products</h3>
            {formData.kitchens && formData.kitchens.length > 0 ? (
              // Show products per kitchen
              <div className="space-y-4">
                {formData.kitchens.map((kitchen, kitchenIndex) => (
                  <div key={kitchenIndex} className="border border-background-600 rounded-lg p-3 sm:p-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-3">{kitchen.kitchenName}</h4>
                    <SelectedProductsList
                      accessories={kitchen.accessories || []}
                      cabinets={kitchen.cabinets || []}
                      doors={kitchen.doors || []}
                      lighting={kitchen.lighting || []}
                      onRemove={(category, index) => {
                        const updatedKitchens = [...(formData.kitchens || [])];
                        const kitchen = updatedKitchens[kitchenIndex];
                        const list = [...(kitchen[category] || [])];
                        const removed = list[index];
                        list.splice(index, 1);
                        updatedKitchens[kitchenIndex] = {
                          ...kitchen,
                          [category]: list,
                        };
                        // Cascade removal: if cabinet removed, also remove linked door
                        // @ts-ignore
                        const pairId = removed?._tempPairId;
                        if (category === 'cabinets' && pairId && Array.isArray(kitchen.doors)) {
                          updatedKitchens[kitchenIndex].doors = kitchen.doors.filter((d: any) => d._tempPairId !== pairId);
                        }
                        setFormData({ ...formData, kitchens: updatedKitchens });
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Show global products (backward compatibility)
              <SelectedProductsList
                accessories={formData.accessories || []}
                cabinets={formData.cabinets || []}
                doors={formData.doors || []}
                lighting={formData.lighting || []}
                onRemove={(category, index) => {
                  const next: any = { ...formData };
                  const list = (next[category] || []).slice();
                  const removed = list[index];
                  list.splice(index, 1);
                  next[category] = list;
                  // Cascade removal: if cabinet removed, also remove linked door
                  // @ts-ignore
                  const pairId = removed?._tempPairId;
                  if (category === 'cabinets' && pairId && Array.isArray(next.doors)) {
                    next.doors = next.doors.filter((d: any) => d._tempPairId !== pairId);
                  }
                  setFormData(next);
                }}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default QuotationBuilderPage;
