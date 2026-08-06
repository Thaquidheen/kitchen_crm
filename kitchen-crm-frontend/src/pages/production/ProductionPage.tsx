/**
 * ProductionPage Component
 * Main page for production & installation management with list and statistics
 */

import { Card } from '@/components/ui/Card';
import { ProductionList } from '@/features/production/components/ProductionList';
import { useGetProductionStatisticsQuery } from '@/features/production/productionAPI';
import { Hammer, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function ProductionPage() {
  const { data: statisticsResponse, isLoading: statsLoading } = useGetProductionStatisticsQuery();
  // The statistics endpoint returns snake_case keys; per-status counts are
  // "<status>_installations" (see ProductionInstallationServiceImpl.getProductionStatistics).
  const statistics: any = statisticsResponse?.data ?? {};
  const num = (k: string) => Number(statistics[k] ?? 0);
  const inProgress =
    num('production_installations') +
    num('site_preparation_installations') +
    num('delivery_installations') +
    num('installation_installations') +
    num('quality_check_installations');

  const statsCards = [
    {
      title: 'Total Installations',
      value: num('total_installations'),
      icon: <Package className="h-6 w-6 text-blue-500" />,
      color: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: <Clock className="h-6 w-6 text-yellow-500" />,
      color: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Ready for Installation',
      value: num('ready_for_installation'),
      icon: <Hammer className="h-6 w-6 text-orange-500" />,
      color: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Completed',
      value: num('completed_installations'),
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      color: 'bg-green-500/10 border-green-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white-900">Production & Installation Management</h1>
        <p className="text-white-600 mt-1">
          Manage production installations, track progress, and coordinate installations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className={`p-6 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white-600">{stat.title}</p>
                <p className="text-2xl font-bold text-white-900">
                  {statsLoading ? '...' : stat.value}
                </p>
              </div>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>

      {/* Production List */}
      <Card className="p-6 bg-black-800 border-black-600">
        <h2 className="text-xl font-bold text-white-900 mb-4">All Production Installations</h2>
        <ProductionList showFilters={true} />
      </Card>
    </div>
  );
}

export default ProductionPage;







