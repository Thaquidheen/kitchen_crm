import React, { useState, useEffect } from 'react';
import { useGetCompanySettingsQuery, useUpdateCompanySettingsMutation } from '../../services/settingsAPI';
import type { CompanySettings } from '../../services/settingsAPI';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import {
  Building2,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Info,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CompanySettingsPage: React.FC = () => {
  const { data: companySettingsResponse, isLoading, error } = useGetCompanySettingsQuery();
  const [updateCompanySettings, { isLoading: isUpdating }] = useUpdateCompanySettingsMutation();

  const [formData, setFormData] = useState<CompanySettings>({
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

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load company settings from API when data is available
  useEffect(() => {
    if (companySettingsResponse?.data) {
      setFormData(companySettingsResponse.data);
    }
  }, [companySettingsResponse]);

  const handleInputChange = (key: keyof CompanySettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaveSuccess(false);
      setSaveError(null);

      const result = await updateCompanySettings(formData).unwrap();

      if (result.success) {
        setSaveSuccess(true);
        toast.success('Company settings updated successfully');
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.message || 'Failed to update company settings');
        toast.error(result.message || 'Failed to update company settings');
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'An error occurred while saving';
      setSaveError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">Failed to load company settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/20 rounded-lg">
            <Building2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Company Information</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage company details that appear on warranty certificates
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold mb-1">Company Information Usage</p>
          <p>
            These details will be displayed on warranty certificates and other official documents.
            Make sure all information is accurate and up-to-date.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Details
          </h2>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="md:col-span-2">
              <Input
                label="Company Name"
                value={formData['company.name']}
                onChange={(e) => handleInputChange('company.name', e.target.value)}
                placeholder="THE HOCH"
                required
              />
            </div>

            {/* Tagline */}
            <div className="md:col-span-2">
              <Input
                label="Tagline"
                value={formData['company.tagline']}
                onChange={(e) => handleInputChange('company.tagline', e.target.value)}
                placeholder="Modular Interiors & Design Solutions"
              />
            </div>

            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <Input
                label="Address Line 1"
                value={formData['company.address_line1']}
                onChange={(e) => handleInputChange('company.address_line1', e.target.value)}
                placeholder="Street address, Building name"
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <Input
                label="City, State, Zip Code"
                value={formData['company.address_line2']}
                onChange={(e) => handleInputChange('company.address_line2', e.target.value)}
                placeholder="City, State, Zip Code"
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Phone */}
            <div>
              <Input
                label="Phone Number"
                value={formData['company.phone']}
                onChange={(e) => handleInputChange('company.phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            {/* Email */}
            <div>
              <Input
                label="Email Address"
                type="email"
                value={formData['company.email']}
                onChange={(e) => handleInputChange('company.email', e.target.value)}
                placeholder="info@company.com"
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <Input
                label="Website URL"
                type="url"
                value={formData['company.website']}
                onChange={(e) => handleInputChange('company.website', e.target.value)}
                placeholder="https://www.company.com"
                icon={<Globe className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-white">Terms & Conditions</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Edit the terms and conditions that appear in quotation PDFs. Each line will be displayed as a separate bullet point or paragraph.
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              {/* General Terms */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  General Terms
                </label>
                <TextArea
                  value={formData['quotation.terms.general']}
                  onChange={(e) => handleInputChange('quotation.terms.general', e.target.value)}
                  placeholder="Enter general terms, one per line..."
                  rows={8}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 focus:ring-red-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Each line will be displayed as a separate bullet point in the PDF.
                </p>
              </div>

              {/* Warranty & Service */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Warranty & Service
                </label>
                <TextArea
                  value={formData['quotation.terms.warranty']}
                  onChange={(e) => handleInputChange('quotation.terms.warranty', e.target.value)}
                  placeholder="Enter warranty and service terms..."
                  rows={10}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 focus:ring-red-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Longer paragraphs will be displayed as paragraphs. Shorter lines or lines with colons will be displayed as bullet points.
                </p>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-medium">Company settings updated successfully!</p>
            </div>
          )}

          {saveError && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{saveError}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isUpdating}
              className="min-w-[150px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CompanySettingsPage;


