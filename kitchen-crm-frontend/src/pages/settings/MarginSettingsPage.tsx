import React, { useState, useEffect } from 'react';
import { useGetMarginsQuery, useUpdateMarginsMutation } from '../../services/settingsAPI';
import type { MarginsData } from '../../services/settingsAPI.types';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Settings,
  Save,
  Package,
  DoorClosed,
  Lightbulb,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingUp,
  Shield
} from 'lucide-react';

export const MarginSettingsPage: React.FC = () => {
  const { data: marginsResponse, isLoading, error } = useGetMarginsQuery();
  const [updateMargins, { isLoading: isUpdating }] = useUpdateMarginsMutation();

  const [formData, setFormData] = useState<MarginsData>({
    accessories: 20,
    cabinets: 20,
    doors: 20,
    lighting: 20,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load margins from API when data is available
  useEffect(() => {
    if (marginsResponse?.data) {
      setFormData(marginsResponse.data);
    }
  }, [marginsResponse]);

  const handleInputChange = (category: keyof MarginsData, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setFormData((prev) => ({
        ...prev,
        [category]: numValue,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaveSuccess(false);
      setSaveError(null);

      const result = await updateMargins(formData).unwrap();

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.message || 'Failed to update margins');
      }
    } catch (err: any) {
      setSaveError(err?.data?.message || 'An error occurred while saving');
    }
  };

  const categories = [
    {
      key: 'accessories' as keyof MarginsData,
      label: 'Accessories',
      icon: Wrench,
      description: 'Hardware, handles, and fixtures',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      key: 'cabinets' as keyof MarginsData,
      label: 'Cabinets',
      icon: Package,
      description: 'Kitchen cabinet units and modules',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
    },
    {
      key: 'doors' as keyof MarginsData,
      label: 'Doors',
      icon: DoorClosed,
      description: 'Cabinet doors and panels',
      color: 'text-red-300',
      bgColor: 'bg-red-300/10',
    },
    {
      key: 'lighting' as keyof MarginsData,
      label: 'Lighting',
      icon: Lightbulb,
      description: 'LED strips and lighting fixtures',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <div className="text-white-600 text-lg">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <div className="text-red-500 text-lg">Failed to load settings. Please try again.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-900 p-6">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Settings className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white-900 mb-2">
                  Margin Settings
                </h1>
                <p className="text-white-600 text-lg">
                  Configure profit margins for product categories
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white-600 mb-1">Average Margin</div>
                <div className="text-2xl font-bold text-white-900">
                  {((formData.accessories + formData.cabinets + formData.doors + formData.lighting) / 4).toFixed(1)}%
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Alert Banner */}
          <div className="flex items-start gap-3 p-4 bg-red-600/10 border-2 border-red-600/30 rounded-xl">
            <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white-900 font-medium mb-1">
                Admin-Only Settings
              </p>
              <p className="text-white-600 text-sm">
                These settings are restricted to administrators. Staff users cannot view or modify margin values.
              </p>
            </div>
          </div>
        </div>

        {/* Main Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <div>
              <h2 className="text-2xl font-bold text-white-900 mb-1">
                Category Margins
              </h2>
              <p className="text-white-600 text-sm">
                Set profit margins for each product category (0-100%)
              </p>
            </div>
          </CardHeader>

          <CardBody>
            {/* Category Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.key}
                    className="relative group"
                  >
                    <div className={`p-6 rounded-xl border-2 border-black-600 ${category.bgColor} hover:border-red-600/50 transition-all duration-200`}>
                      {/* Icon Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-lg ${category.bgColor} border-2 border-black-600 flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white-900">
                            {category.label}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white-600 mb-4 min-h-[32px]">
                        {category.description}
                      </p>

                      {/* Input Section */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white-900">
                          Margin Percentage
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData[category.key]}
                            onChange={(e) => handleInputChange(category.key, e.target.value)}
                            placeholder="0.00"
                            className="text-2xl font-bold text-center pr-8"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white-600 text-xl font-bold pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Value Indicator */}
                      <div className="mt-4 pt-4 border-t border-black-600">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white-600">Applied to quotations</span>
                          <span className={`font-bold ${category.color}`}>
                            {formData[category.key].toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Success/Error Messages */}
            {saveSuccess && (
              <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 font-bold mb-1">Margins updated successfully!</p>
                    <p className="text-green-500/80 text-sm">All new quotations will use these margin values.</p>
                  </div>
                </div>
              </div>
            )}

            {saveError && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-bold mb-1">Failed to update margins</p>
                    <p className="text-red-500/80 text-sm">{saveError}</p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>

          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white-600 text-sm">
              <Info className="w-4 h-4" />
              <span>Changes take effect immediately for new quotations</span>
            </div>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              variant="primary"
              size="lg"
              leftIcon={<Save className="w-5 h-5" />}
            >
              {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>

        {/* Information Card */}
        <Card className="bg-black-800/50 border-black-600">
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white-900 mb-3">
                  Important Information
                </h3>
                <ul className="space-y-2 text-white-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>These margins are applied globally to all quotations throughout the system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Staff users cannot view or modify these margin values for security purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Changes take effect immediately and apply to all new quotations created after saving</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Existing quotations retain their original margin values and are not affected by changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Margin percentages must be between 0% and 100% and can include decimal values</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default MarginSettingsPage;

