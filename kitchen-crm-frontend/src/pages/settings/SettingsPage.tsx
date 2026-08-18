import React, { useState, useEffect, useMemo } from 'react';
import { useGetMarginsQuery, useUpdateMarginsMutation, useGetCompanySettingsQuery, useUpdateCompanySettingsMutation } from '../../services/settingsAPI';
import type { MarginsData } from '../../services/settingsAPI.types';
import type { CompanySettings } from '../../services/settingsAPI';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { ActivityLogTab } from '../../features/activity/ActivityLogTab';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Tabs } from '../../components/ui/Tabs';
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
  History,
  Shield,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeSelector } from '../../features/theme/components/ThemeSelector';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentTheme } from '../../features/theme/themeSlice';

export const SettingsPage: React.FC = () => {
  // Get current theme for dynamic colors
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        primary: '#6366F1',
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B',
        text: '#FFFFFF',
        inputBg: '#1A1A24',
      };
    }
    const isLightTheme = currentTheme.type === 'light';
    return {
      primary: currentTheme.colors.primary[600],
      success: currentTheme.colors.semantic.success,
      error: currentTheme.colors.semantic.error,
      info: currentTheme.colors.semantic.info,
      warning: currentTheme.colors.semantic.warning,
      text: isLightTheme ? currentTheme.colors.text[900] : currentTheme.colors.text[900],
      inputBg: currentTheme.colors.background[700],
    };
  }, [currentTheme]);

  // Margin Settings
  const { data: marginsResponse, isLoading: isLoadingMargins, error: marginsError } = useGetMarginsQuery();
  const [updateMargins, { isLoading: isUpdatingMargins }] = useUpdateMarginsMutation();

  const [marginFormData, setMarginFormData] = useState<MarginsData>({
    accessories: 20,
    cabinets: 20,
    doors: 20,
    lighting: 20,
  });

  const [marginSaveSuccess, setMarginSaveSuccess] = useState(false);
  const [marginSaveError, setMarginSaveError] = useState<string | null>(null);

  // Company Settings
  const { data: companySettingsResponse, isLoading: isLoadingCompany, error: companyError } = useGetCompanySettingsQuery();
  const [updateCompanySettings, { isLoading: isUpdatingCompany }] = useUpdateCompanySettingsMutation();

  const [companyFormData, setCompanyFormData] = useState<CompanySettings>({
    'company.name': '',
    'company.tagline': '',
    'company.address_line1': '',
    'company.address_line2': '',
    'company.phone': '',
    'company.email': '',
    'company.website': '',
    'quotation.terms.general': '',
    'quotation.terms.warranty': '',
  });

  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);
  const [companySaveError, setCompanySaveError] = useState<string | null>(null);

  // Load margins from API when data is available
  useEffect(() => {
    if (marginsResponse?.data) {
      setMarginFormData(marginsResponse.data);
    }
  }, [marginsResponse]);

  // Load company settings from API when data is available
  useEffect(() => {
    if (companySettingsResponse?.data) {
      setCompanyFormData(companySettingsResponse.data);
    }
  }, [companySettingsResponse]);

  // Margin Settings Handlers
  const handleMarginInputChange = (category: keyof MarginsData, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setMarginFormData((prev) => ({
        ...prev,
        [category]: numValue,
      }));
    }
  };

  const handleMarginSave = async () => {
    try {
      setMarginSaveSuccess(false);
      setMarginSaveError(null);

      const result = await updateMargins(marginFormData).unwrap();

      if (result.success) {
        setMarginSaveSuccess(true);
        toast.success('Margin settings updated successfully');
        setTimeout(() => setMarginSaveSuccess(false), 3000);
      } else {
        setMarginSaveError(result.message || 'Failed to update margins');
        toast.error(result.message || 'Failed to update margins');
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'An error occurred while saving';
      setMarginSaveError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Company Settings Handlers
  const handleCompanyInputChange = (key: keyof CompanySettings, value: string) => {
    setCompanyFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCompanySave = async () => {
    try {
      setCompanySaveSuccess(false);
      setCompanySaveError(null);

      const result = await updateCompanySettings(companyFormData).unwrap();

      if (result.success) {
        setCompanySaveSuccess(true);
        toast.success('Company settings updated successfully');
        setTimeout(() => setCompanySaveSuccess(false), 3000);
      } else {
        setCompanySaveError(result.message || 'Failed to update company settings');
        toast.error(result.message || 'Failed to update company settings');
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'An error occurred while saving';
      setCompanySaveError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const marginCategories = [
    {
      key: 'accessories' as keyof MarginsData,
      label: 'Accessories',
      icon: Wrench,
      description: 'Hardware, handles, and fixtures',
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
    {
      key: 'cabinets' as keyof MarginsData,
      label: 'Cabinets',
      icon: Package,
      description: 'Kitchen cabinet units and modules',
      color: 'text-primary-400',
      bgColor: 'bg-primary-400/10',
    },
    {
      key: 'doors' as keyof MarginsData,
      label: 'Doors',
      icon: DoorClosed,
      description: 'Cabinet doors and panels',
      color: 'text-primary-300',
      bgColor: 'bg-primary-300/10',
    },
    {
      key: 'lighting' as keyof MarginsData,
      label: 'Lighting',
      icon: Lightbulb,
      description: 'LED strips and lighting fixtures',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  // Loading state
  if (isLoadingMargins || isLoadingCompany) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <div className="text-text-600 text-lg">Loading settings...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (marginsError || companyError) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <div className="text-error text-lg">Failed to load settings. Please try again.</div>
        </div>
      </div>
    );
  }

  // Margin Settings Tab Content
  const marginSettingsContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-900 mb-1 sm:mb-2">
                Margin Settings
              </h2>
              <p className="text-text-600 text-sm sm:text-lg">
                Configure profit margins for product categories
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className="text-xs sm:text-sm text-text-600 mb-1">Average Margin</div>
              <div className="text-xl sm:text-2xl font-bold text-text-900">
                {((marginFormData.accessories + marginFormData.cabinets + marginFormData.doors + marginFormData.lighting) / 4).toFixed(1)}%
              </div>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
          </div>
        </div>

        {/* Alert Banner */}
        <div 
          className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2"
          style={{
            backgroundColor: `${themeColors.primary}15`,
            borderColor: `${themeColors.primary}4D`,
          }}
        >
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: themeColors.primary }} />
          <div className="flex-1 min-w-0">
            <p className="text-text-900 font-medium mb-1 text-sm sm:text-base">
              Admin-Only Settings
            </p>
            <p className="text-text-600 text-xs sm:text-sm">
              These settings are restricted to administrators. Staff users cannot view or modify margin values.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <div>
            <h3 className="text-2xl font-bold text-text-900 mb-1">
              Category Margins
            </h3>
            <p className="text-text-600 text-sm">
              Set profit margins for each product category (0-100%)
            </p>
          </div>
        </CardHeader>

        <CardBody>
          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {marginCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.key}
                  className="relative group"
                >
                  <div 
                    className="p-4 sm:p-6 lg:p-6 rounded-xl border-2 border-background-600 hover:border-primary-600/50 transition-all duration-200 h-full"
                    style={{ backgroundColor: `${themeColors.primary}15` }}
                  >
                    {/* Icon Header */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-background-600 flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${themeColors.primary}15` }}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: themeColors.primary }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-text-900 truncate">
                          {category.label}
                        </h4>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-text-600 mb-3 sm:mb-4 min-h-[32px]">
                      {category.description}
                    </p>

                    {/* Input Section */}
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-semibold text-text-900">
                        Margin Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={marginFormData[category.key]}
                          onChange={(e) => handleMarginInputChange(category.key, e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-lg border-2 border-background-600 text-xl sm:text-2xl font-bold text-center pr-8 focus:outline-none focus:ring-2 focus:border-primary-700 focus:ring-primary-700 transition-all"
                          style={{ 
                            color: themeColors.text,
                            backgroundColor: themeColors.inputBg,
                            WebkitTextFillColor: themeColors.text,
                          }}
                          autoComplete="off"
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-text-600 text-lg sm:text-xl font-bold pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Value Indicator */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-background-600">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-600">Applied to quotations</span>
                        <span className="font-bold" style={{ color: themeColors.primary }}>
                          {marginFormData[category.key].toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success/Error Messages */}
          {marginSaveSuccess && (
            <div 
              className="p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 border-2"
              style={{
                backgroundColor: `${themeColors.success}1A`,
                borderColor: `${themeColors.success}4D`,
              }}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: themeColors.success }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold mb-1 text-sm sm:text-base" style={{ color: themeColors.success }}>
                    Margins updated successfully!
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: `${themeColors.success}CC` }}>
                    All new quotations will use these margin values.
                  </p>
                </div>
              </div>
            </div>
          )}

          {marginSaveError && (
            <div 
              className="p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 border-2"
              style={{
                backgroundColor: `${themeColors.error}1A`,
                borderColor: `${themeColors.error}4D`,
              }}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: themeColors.error }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold mb-1 text-sm sm:text-base" style={{ color: themeColors.error }}>
                    Failed to update margins
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: `${themeColors.error}CC` }}>
                    {marginSaveError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-2 text-text-600 text-xs sm:text-sm">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Changes take effect immediately for new quotations</span>
          </div>
          <Button
            onClick={handleMarginSave}
            disabled={isUpdatingMargins}
            variant="primary"
            size="lg"
            leftIcon={<Save className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full sm:w-auto"
          >
            {isUpdatingMargins ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      {/* Information Card */}
      <Card className="bg-background-800/50 border-background-600">
        <CardBody>
          <div className="flex items-start gap-3 sm:gap-4">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${themeColors.primary}1A` }}
            >
              <Info className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: themeColors.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-text-900 mb-2 sm:mb-3">
                Important Information
              </h3>
              <ul className="space-y-2 text-text-600 text-sm sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0" style={{ color: themeColors.primary }}>•</span>
                  <span>These margins are applied globally to all quotations throughout the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0" style={{ color: themeColors.primary }}>•</span>
                  <span>Staff users cannot view or modify these margin values for security purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0" style={{ color: themeColors.primary }}>•</span>
                  <span>Changes take effect immediately and apply to all new quotations created after saving</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0" style={{ color: themeColors.primary }}>•</span>
                  <span>Existing quotations retain their original margin values and are not affected by changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0" style={{ color: themeColors.primary }}>•</span>
                  <span>Margin percentages must be between 0% and 100% and can include decimal values</span>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Company Settings Tab Content
  const companySettingsContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-background-900 via-background-800 to-background-900 border border-background-700 rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="p-2 sm:p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${themeColors.primary}1A` }}
          >
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: themeColors.primary }} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-900">Company Information</h2>
            <p className="text-xs sm:text-sm text-text-600 mt-1">
              Manage company details that appear on warranty certificates
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div 
        className="rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3 border"
        style={{
          backgroundColor: `${themeColors.info}33`,
          borderColor: `${themeColors.info}80`,
        }}
      >
        <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: themeColors.info }} />
        <div className="text-xs sm:text-sm flex-1 min-w-0" style={{ color: themeColors.info }}>
          <p className="font-semibold mb-1">Company Information Usage</p>
          <p>
            These details will be displayed on warranty certificates and other official documents.
            Make sure all information is accurate and up-to-date.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-gradient-to-br from-background-900 to-background-800 border-background-700">
        <CardHeader className="border-b border-background-700">
          <h3 className="text-lg sm:text-xl font-bold text-text-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            Company Details
          </h3>
        </CardHeader>
        <CardBody className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Company Name */}
            <div className="md:col-span-2">
              <Input
                label="Company Name"
                value={companyFormData['company.name']}
                onChange={(e) => handleCompanyInputChange('company.name', e.target.value)}
                placeholder="THE HOCH"
                required
              />
            </div>

            {/* Tagline */}
            <div className="md:col-span-2">
              <Input
                label="Tagline"
                value={companyFormData['company.tagline']}
                onChange={(e) => handleCompanyInputChange('company.tagline', e.target.value)}
                placeholder="Modular Interiors & Design Solutions"
              />
            </div>

            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <Input
                label="Address Line 1"
                value={companyFormData['company.address_line1']}
                onChange={(e) => handleCompanyInputChange('company.address_line1', e.target.value)}
                placeholder="Street address, Building name"
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <Input
                label="City, State, Zip Code"
                value={companyFormData['company.address_line2']}
                onChange={(e) => handleCompanyInputChange('company.address_line2', e.target.value)}
                placeholder="City, State, Zip Code"
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Phone */}
            <div>
              <Input
                label="Phone Number"
                value={companyFormData['company.phone']}
                onChange={(e) => handleCompanyInputChange('company.phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            {/* Email */}
            <div>
              <Input
                label="Email Address"
                type="email"
                value={companyFormData['company.email']}
                onChange={(e) => handleCompanyInputChange('company.email', e.target.value)}
                placeholder="info@company.com"
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <Input
                label="Website URL"
                type="url"
                value={companyFormData['company.website']}
                onChange={(e) => handleCompanyInputChange('company.website', e.target.value)}
                placeholder="https://www.company.com"
                icon={<Globe className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-background-700">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: themeColors.primary }} />
              <h3 className="text-base sm:text-lg font-bold text-text-900">Terms & Conditions</h3>
            </div>
            <p className="text-xs sm:text-sm text-text-600 mb-4 sm:mb-6">
              Edit the terms and conditions that appear in quotation PDFs. Each line will be displayed as a separate bullet point or paragraph.
            </p>
            
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* General Terms */}
              <div>
                <label className="block text-sm font-medium text-text-900 mb-2">
                  General Terms
                </label>
                <TextArea
                  value={companyFormData['quotation.terms.general']}
                  onChange={(e) => handleCompanyInputChange('quotation.terms.general', e.target.value)}
                  placeholder="Enter general terms, one per line..."
                  rows={8}
                  className="w-full bg-background-800 border-background-700 text-text-900 placeholder-text-500 focus:border-primary-600 focus:ring-primary-600"
                />
                <p className="mt-1 text-xs text-text-500">
                  Each line will be displayed as a separate bullet point in the PDF.
                </p>
              </div>

              {/* Warranty & Service */}
              <div>
                <label className="block text-sm font-medium text-text-900 mb-2">
                  Warranty & Service
                </label>
                <TextArea
                  value={companyFormData['quotation.terms.warranty']}
                  onChange={(e) => handleCompanyInputChange('quotation.terms.warranty', e.target.value)}
                  placeholder="Enter warranty and service terms..."
                  rows={10}
                  className="w-full bg-background-800 border-background-700 text-text-900 placeholder-text-500 focus:border-primary-600 focus:ring-primary-600"
                />
                <p className="mt-1 text-xs text-text-500">
                  Longer paragraphs will be displayed as paragraphs. Shorter lines or lines with colons will be displayed as bullet points.
                </p>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {companySaveSuccess && (
            <div 
              className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 border"
              style={{
                backgroundColor: `${themeColors.success}33`,
                borderColor: `${themeColors.success}80`,
              }}
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: themeColors.success }} />
              <p className="text-xs sm:text-sm font-medium flex-1 min-w-0" style={{ color: themeColors.success }}>
                Company settings updated successfully!
              </p>
            </div>
          )}

          {companySaveError && (
            <div 
              className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 border"
              style={{
                backgroundColor: `${themeColors.error}33`,
                borderColor: `${themeColors.error}80`,
              }}
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: themeColors.error }} />
              <p className="text-xs sm:text-sm flex-1 min-w-0" style={{ color: themeColors.error }}>
                {companySaveError}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 sm:mt-8 flex justify-end">
            <Button
              variant="primary"
              onClick={handleCompanySave}
              disabled={isUpdatingCompany}
              className="w-full sm:w-auto min-w-[150px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdatingCompany ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-900 mb-1 sm:mb-2">
                Settings
              </h1>
              <p className="text-text-600 text-sm sm:text-base lg:text-lg">
                Manage system settings and company information
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              label: 'Margin Settings',
              icon: <TrendingUp className="w-4 h-4" />,
              content: marginSettingsContent,
            },
            {
              label: 'Company Settings',
              icon: <Building2 className="w-4 h-4" />,
              content: companySettingsContent,
            },
            {
              label: 'Theme Configuration',
              icon: <Palette className="w-4 h-4" />,
              content: <ThemeSelector />,
            },
            {
              label: 'Activity Log',
              icon: <History className="w-4 h-4" />,
              content: <ActivityLogTab />,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default SettingsPage;



