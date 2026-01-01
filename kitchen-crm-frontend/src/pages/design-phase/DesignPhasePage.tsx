/**
 * DesignPhasePage Component
 * Main page for design phase management with list and statistics
 * Updated to fix useNavigate reference error
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DesignPhaseList } from '@/features/design-phase/components/DesignPhaseList';
import { DesignPhaseCreateModal } from '@/features/design-phase/components/DesignPhaseCreateModal';
import { useGetDesignPhaseStatisticsQuery, useCreateDesignPhaseMutation } from '@/features/design-phase/designPhaseApi';
import { DesignStatus } from '@/features/design-phase/types';
import { Plus, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { DesignPhaseCreateRequest } from '@/features/design-phase/types';

export function DesignPhasePage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';
  
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: statisticsResponse, isLoading: statsLoading, refetch: refetchStats } = useGetDesignPhaseStatisticsQuery();
  const [createDesignPhase, { isLoading: creating }] = useCreateDesignPhaseMutation();
  const statistics = statisticsResponse?.data;

  // Handle create design phase submission
  const handleDesignPhaseSubmit = async (data: DesignPhaseCreateRequest) => {
    try {
      const result = await createDesignPhase({
        customerId: data.customerId,
        quotationId: data.quotationId,
        designRequirements: data.designRequirements,
        staffAssignedId: data.staffAssignedId
      }).unwrap();

      if (result.success) {
        toast.success('Design phase created successfully!');
        setIsCreateModalOpen(false);
        // Force refresh by updating key and refetching statistics
        // This will remount the DesignPhaseList component and reset filters
        setRefreshKey(prev => prev + 1);
        refetchStats();
        // Switch to 'all' tab to ensure the new design phase is visible
        setActiveTab('all');
      } else {
        toast.error(result.message || 'Failed to create design phase');
      }
    } catch (error: any) {
      console.error('Error creating design phase:', error);
      toast.error(error?.data?.message || 'Failed to create design phase');
    }
  };

  const handleCreateDesignPhase = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const statsCards = [
    {
      title: 'Total Designs',
      value: statistics?.totalDesigns || 0,
      icon: <Users className="h-5 w-5 sm:h-6 sm:w-6 text-info" />,
      color: 'bg-info/10 border-info hover:border-info/80',
    },
    {
      title: 'In Progress',
      value: statistics?.designsByStatus?.IN_PROGRESS || 0,
      icon: <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />,
      color: 'bg-warning/10 border-warning hover:border-warning/80',
    },
    {
      title: 'Pending Approval',
      value: statistics?.designsPendingApproval || 0,
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />,
      color: 'bg-warning/10 border-warning hover:border-warning/80',
    },
    {
      title: 'Upcoming Meetings',
      value: statistics?.upcomingMeetings || 0,
      icon: <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-success" />,
      color: 'bg-success/10 border-success hover:border-success/80',
    },
  ];

  return (
    <div className="min-h-screen bg-background-900 p-2 sm:p-3 lg:p-4">
      <div className="w-full space-y-3 sm:space-y-4 lg:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-background-700">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-primary-600/10 rounded-lg sm:rounded-xl">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-900">Design Phase Management</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">
                Manage design phases, track progress, and coordinate with clients
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <Button 
              onClick={handleCreateDesignPhase} 
              className="flex items-center gap-2 w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="h-4 w-4" />
              Create Design Phase
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className={`p-4 sm:p-5 ${stat.color} transition-all duration-200 hover:shadow-lg cursor-default`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-text-600 mb-1.5 sm:mb-2">{stat.title}</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-900">
                    {statsLoading ? '...' : (stat.value || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-background-600">
          <nav className="-mb-px flex flex-wrap space-x-4 sm:space-x-8">
            {[
              { id: 'all', label: 'All Design Phases' },
              { id: 'upcoming', label: 'Upcoming Meetings' },
              { id: 'pending', label: 'Pending Approval' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-text-600 hover:text-text-900 hover:border-background-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-4 sm:mt-5 lg:mt-6">
          {activeTab === 'all' && (
            <DesignPhaseList key={refreshKey} showFilters={true} />
          )}
          {activeTab === 'upcoming' && (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-text-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-text-900 mb-2">Upcoming Meetings</h3>
              <p className="text-sm sm:text-base text-text-600">
                Meeting scheduler component will be implemented here
              </p>
            </div>
          )}
          {activeTab === 'pending' && (
            <div>
              {isSuperAdmin ? (
                <DesignPhaseList 
                  showFilters={true}
                  customerId={undefined}
                  initialStatus={DesignStatus.PENDING_SUPERADMIN_APPROVAL}
                />
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-text-600 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-text-900 mb-2">Pending Approval</h3>
                  <p className="text-sm sm:text-base text-text-600">
                    Only superadmin can view pending approvals
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Design Phase Modal */}
        {isCreateModalOpen && (
          <DesignPhaseCreateModal
            isOpen={isCreateModalOpen}
            onClose={handleCloseCreateModal}
            onSubmit={handleDesignPhaseSubmit}
            mode="create"
            title="Create Design Phase"
          />
        )}
      </div>
    </div>
  );
}

export default DesignPhasePage;
