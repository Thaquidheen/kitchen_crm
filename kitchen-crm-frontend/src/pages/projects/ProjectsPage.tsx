/**
 * ProjectsPage
 * Main page for displaying and managing projects
 */

import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectList } from '@/features/projects/components/ProjectList';
import { useGetProjectStatisticsQuery } from '@/features/projects/projectsAPI';
import { Briefcase, Plus, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

export function ProjectsPage() {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const { data: statistics, isLoading: statsLoading } = useGetProjectStatisticsQuery();

  // Theme-based stats configuration
  const stats = [
    {
      label: 'Total Projects',
      value: statistics?.totalProjects || 0,
      icon: Briefcase,
      color: currentTheme?.colors?.primary?.[600] || 'text-blue-500',
    },
    {
      label: 'Active Projects',
      value: statistics?.activeProjects || 0,
      icon: TrendingUp,
      color: currentTheme?.colors?.accent?.[500] || 'text-green-500',
    },
    {
      label: 'Completed Projects',
      value: statistics?.completedProjects || 0,
      icon: CheckCircle,
      color: currentTheme?.colors?.accent?.[400] || 'text-purple-500',
    },
    {
      label: 'Total Revenue',
      value: `₹${(statistics?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: currentTheme?.colors?.warning || 'text-yellow-500',
    },
  ];

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: currentTheme?.colors?.background?.[900] || '#111827' }}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${currentTheme?.colors?.primary?.[600]}20` }}
            >
              <Briefcase
                className="h-6 w-6 sm:h-8 sm:w-8"
                style={{ color: currentTheme?.colors?.primary?.[600] || '#dc2626' }}
              />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
              >
                Projects
              </h1>
              <p
                className="text-sm sm:text-base mt-1"
                style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
              >
                Manage all your projects
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/projects/new')}
            className="w-full sm:w-auto min-w-[140px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Statistics Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
                  borderColor: currentTheme?.colors?.background?.[600] || '#374151'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p
                      className="text-xs sm:text-sm font-medium mb-1"
                      style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
                    >
                      {stat.label}
                    </p>
                    <div
                      className="text-lg sm:text-2xl font-bold mt-1"
                      style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                    >
                      {statsLoading ? (
                        <div
                          className="h-6 w-16 sm:h-8 sm:w-24 rounded animate-pulse"
                          style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
                        />
                      ) : (
                        <span className="break-words">{stat.value}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-shrink-0">
                    <Icon
                      className={`h-8 w-8 sm:h-10 sm:w-10 transition-opacity hover:opacity-80`}
                      style={{ color: stat.color }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Project List - Responsive */}
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <h2
          className="text-lg sm:text-xl font-bold mb-4 sm:mb-6"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
        >
          All Projects
        </h2>
        <div className="w-full overflow-x-auto">
          <ProjectList />
        </div>
      </Card>
    </div>
  );
}

export default ProjectsPage;
