/**
 * ConvertQuotationPage
 * Page for converting quotations to projects
 */

import { QuotationConverter } from '@/features/projects/components/QuotationConverter';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Button } from '@/components/ui/Button';

export function ConvertQuotationPage() {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: currentTheme?.colors?.background?.[900] || '#111827' }}
    >
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme?.colors?.error || '#dc2626'}20` }}
          >
            <Briefcase
              className="h-8 w-8"
              style={{ color: currentTheme?.colors?.error || '#dc2626' }}
            />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              Convert Quotation
            </h1>
            <p
              className="text-sm sm:text-base mt-1"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Create a new project from an approved quotation
            </p>
          </div>
        </div>
      </div>

      <QuotationConverter />
    </div>
  );
}

export default ConvertQuotationPage;
