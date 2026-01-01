import React from 'react';
import { Briefcase, Plus, Eye, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CustomerProjectsTabProps {
  customerId: number;
}

// Temporary placeholder type until projects module is implemented
interface Project {
  id: number;
  projectNumber: string;
  title: string;
  status: string;
  budget: number;
  actualCost?: number;
  startDate: string;
  targetCompletionDate?: string;
  completionPercentage: number;
}

export const CustomerProjectsTab: React.FC<CustomerProjectsTabProps> = ({ customerId }) => {
  const navigate = useNavigate();

  // TODO: Replace with actual API call when projects module is implemented
  // const { data: projects, isLoading } = useGetProjectsByCustomerQuery(customerId);
  const projects: Project[] = [];
  const isLoading = false;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-info/20 text-info border-info',
      IN_PROGRESS: 'bg-warning/20 text-warning border-warning',
      ON_HOLD: 'bg-warning/20 text-warning border-warning',
      COMPLETED: 'bg-success/20 text-success border-success',
      CANCELLED: 'bg-error/20 text-error border-error',
    };
    return colors[status] || colors.PLANNING;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-background-800 border border-background-600 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-background-600 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-background-600 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-900">Projects</h2>
          <p className="text-sm text-text-600 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => navigate(`/projects/new?customerId=${customerId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-lg p-12 text-center">
          <Briefcase className="w-12 h-12 text-text-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-900 mb-2">No Projects Yet</h3>
          <p className="text-text-600 mb-6">
            Create your first project for this customer to get started
          </p>
          <button
            onClick={() => navigate(`/projects/new?customerId=${customerId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-background-800 border border-background-600 rounded-lg p-4 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-900">{project.title}</h3>
                    <span
                      className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-600">Project #{project.projectNumber}</p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-2 text-text-900 hover:bg-background-700 rounded-md transition-colors"
                  title="View Project"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-600">Progress</span>
                  <span className="text-sm text-text-900 font-semibold">
                    {project.completionPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-background-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${project.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-text-600" />
                  <div>
                    <p className="text-xs text-text-600">Budget</p>
                    <p className="text-sm text-text-900 font-semibold">
                      {formatCurrency(project.budget)}
                    </p>
                  </div>
                </div>

                {project.actualCost && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-text-600" />
                    <div>
                      <p className="text-xs text-text-600">Actual Cost</p>
                      <p className="text-sm text-text-900 font-semibold">
                        {formatCurrency(project.actualCost)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-600" />
                  <div>
                    <p className="text-xs text-text-600">Start Date</p>
                    <p className="text-sm text-text-900">{formatDate(project.startDate)}</p>
                  </div>
                </div>

                {project.targetCompletionDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-600" />
                    <div>
                      <p className="text-xs text-text-600">Target Date</p>
                      <p className="text-sm text-text-900">
                        {formatDate(project.targetCompletionDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerProjectsTab;
