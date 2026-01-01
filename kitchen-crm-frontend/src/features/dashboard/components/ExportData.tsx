/**
 * ExportData Component
 * Allows SUPER_ADMIN to export dashboard data
 */

import { useLazyExportDashboardDataQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectRevenueAnalyticsDateRange } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, FileText, Table } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ExportData() {
  const dateRange = useAppSelector(selectRevenueAnalyticsDateRange);
  const [exportData, { isLoading }] = useLazyExportDashboardDataQuery();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv');

  const handleExport = async () => {
    try {
      toast.loading('Preparing export...');

      const blob = await exportData({
        format: selectedFormat,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      }).unwrap();

      // Create download link
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${dateRange.fromDate}-to-${dateRange.toDate}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`Dashboard data exported as ${selectedFormat.toUpperCase()}`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export data. Please try again.');
      console.error('Export error:', error);
    }
  };

  return (
    <Card className="p-6 bg-black-800 border-black-600">
      <div className="mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-white-900">Export Data</h3>
        <span className="px-2 py-1 bg-red-900/20 text-red-600 text-xs font-semibold rounded">
          SUPER ADMIN
        </span>
      </div>

      <p className="text-sm text-white-600 mb-6">
        Export dashboard data for the selected date range: {dateRange.fromDate} to{' '}
        {dateRange.toDate}
      </p>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white-700 mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedFormat('csv')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedFormat === 'csv'
                ? 'border-red-700 bg-red-900/20'
                : 'border-black-600 bg-black-700 hover:border-black-500'
            }`}
          >
            <Table className="h-6 w-6 text-white-700" />
            <div className="text-left">
              <p className="font-semibold text-white-900">CSV</p>
              <p className="text-xs text-white-600">
                Spreadsheet compatible format
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat('pdf')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedFormat === 'pdf'
                ? 'border-red-700 bg-red-900/20'
                : 'border-black-600 bg-black-700 hover:border-black-500'
            }`}
          >
            <FileText className="h-6 w-6 text-white-700" />
            <div className="text-left">
              <p className="font-semibold text-white-900">PDF</p>
              <p className="text-xs text-white-600">Formatted document</p>
            </div>
          </button>
        </div>
      </div>

      {/* Export Button */}
      <Button
        variant="primary"
        onClick={handleExport}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white-900 mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export as {selectedFormat.toUpperCase()}
          </>
        )}
      </Button>

      {/* Export Info */}
      <div className="mt-4 bg-black-700 rounded p-3">
        <p className="text-xs text-white-600">
          <strong className="text-white-900">Note:</strong> Exported data
          includes all dashboard metrics, revenue analytics, project data, and
          customer information for the selected period. This feature is only
          available to SUPER_ADMIN users.
        </p>
      </div>
    </Card>
  );
}

export default ExportData;
