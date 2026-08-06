/**
 * ProductionDetailPage Component
 * Detailed view of a specific production installation
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGetProductionInstallationByCustomerQuery } from '@/features/production/productionAPI';
import { CustomerProductionTab } from '@/features/customers/components/CustomerProductionTab';
import { ArrowLeft, Package } from 'lucide-react';

function ProductionDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/production');
  };

  if (!customerId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Production
          </Button>
        </div>
        <Card className="p-6 bg-background-800 border-background-600">
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-text-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-900 mb-2">Invalid Customer ID</h3>
            <p className="text-text-600">Please provide a valid customer ID.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Production
        </Button>
      </div>
      
      <CustomerProductionTab customerId={Number(customerId)} />
    </div>
  );
}

export default ProductionDetailPage;







