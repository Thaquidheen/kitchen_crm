/**
 * DesignPhaseDetailPage Component
 * Detailed view of a specific design phase with all management features
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SmartDesignPhaseManager } from '@/features/design-phase/components/SmartDesignPhaseManager';
import { ArrowLeft } from 'lucide-react';

function DesignPhaseDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/design-phase');
  };

  if (!customerId) {
    return (
      <div className="min-h-screen bg-background-900 p-2 sm:p-3 lg:p-4">
        <div className="w-full space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Design Phases
            </Button>
          </div>
          <div className="text-center py-8 sm:py-12">
            <h3 className="text-lg sm:text-xl font-semibold text-text-900 mb-2">Invalid Customer ID</h3>
            <p className="text-sm sm:text-base text-text-600">Please provide a valid customer ID.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-900 p-2 sm:p-3 lg:p-4">
      <div className="w-full space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 text-text-900 hover:text-primary-500">
            <ArrowLeft className="h-4 w-4" />
            Back to Design Phases
          </Button>
        </div>
      
        <SmartDesignPhaseManager 
          customerId={Number(customerId)} 
          onClose={handleBack}
        />
      </div>
    </div>
  );
}

export default DesignPhaseDetailPage;