/**
 * ProjectDetailPage
 * Detailed view of a single project with tabs
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FinancialSummary } from '@/features/projects/components/FinancialSummary';
import { PaymentSummary } from '@/features/payments/components/PaymentSummary';
import ExpenseForm from '@/features/expenses/components/ExpenseForm';
import ExpensesList from '@/features/expenses/components/ExpensesList';
import { ProjectCashCalculation } from '@/features/projects/components/ProjectCashCalculation';
import { useGetProjectByIdQuery, useUpdateProjectStatusMutation } from '@/features/projects/projectsAPI';
import { Briefcase, ArrowLeft, Edit, DollarSign, FileText, Clock, Plus, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProjectStatus } from '@/features/projects/types';
import { Select } from '@/components/ui/Select';
import type { Expense } from '@/features/expenses/expensesAPI';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const projectId = Number(id);
  const { data: project, isLoading, error } = useGetProjectByIdQuery(projectId, {
    skip: isNaN(projectId),
  });
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateProjectStatusMutation();

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !project) return;

    try {
      await updateStatus({ id: project.id!, status: selectedStatus }).unwrap();
      toast.success('Project status updated successfully');
      setSelectedStatus('');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error?.data?.message || 'Failed to update status');
    }
  };

  if (error) {
    return (
      <div
        className="min-h-screen p-6"
        style={{ backgroundColor: currentTheme?.colors?.background?.[900] || '#111827' }}
      >
        <Card
          className="p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
            Failed to load project
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div
        className="min-h-screen p-6"
        style={{ backgroundColor: currentTheme?.colors?.background?.[900] || '#111827' }}
      >
        <Card
          className="p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="space-y-4">
            <div
              className="h-8 w-64 rounded animate-pulse"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
            />
            <div
              className="h-4 w-48 rounded animate-pulse"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
            />
            <div
              className="h-4 w-40 rounded animate-pulse"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
            />
          </div>
        </Card>
      </div>
    );
  }

  const overviewTab = (
    <div className="space-y-4 sm:space-y-6">
      {/* Project Information */}
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <h3
          className="text-base sm:text-lg font-bold mb-4"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
        >
          Project Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Customer
            </p>
            <p
              className="font-medium mt-1 break-words"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {project.customerName || '-'}
            </p>
          </div>
          <div>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Status
            </p>
            <div className="mt-1">
              <StatusBadge status={project.status} />
            </div>
          </div>
          <div>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Quotation Number
            </p>
            <p
              className="font-medium mt-1 break-words"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {project.quotationNumber || '-'}
            </p>
          </div>
          <div>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Start Date
            </p>
            <p
              className="font-medium mt-1"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Expected Completion
            </p>
            <p
              className="font-medium mt-1"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {project.expectedCompletionDate
                ? new Date(project.expectedCompletionDate).toLocaleDateString()
                : '-'}
            </p>
          </div>
          <div>
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Actual Completion
            </p>
            <p
              className="font-medium mt-1"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {project.actualCompletionDate
                ? new Date(project.actualCompletionDate).toLocaleDateString()
                : '-'}
            </p>
          </div>
        </div>
        {project.projectDescription && (
          <div className="mt-4">
            <p
              className="text-sm"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              Description
            </p>
            <p
              className="mt-1 break-words"
              style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
            >
              {project.projectDescription}
            </p>
          </div>
        )}
      </Card>

      {/* Status Management */}
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <h3
          className="text-base sm:text-lg font-bold mb-4"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
        >
          Update Status
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'Select new status...' },
                { value: ProjectStatus.ACTIVE, label: 'Active' },
                { value: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
                { value: ProjectStatus.COMPLETED, label: 'Completed' },
                { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || isUpdatingStatus}
            className="w-full sm:w-auto"
          >
            {isUpdatingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </Card>
    </div>
  );

  const financialTab = <FinancialSummary project={project} />;

  const paymentsTab = <PaymentSummary projectId={project.id!} project={project} />;

  const expensesTab = (
    <div className="space-y-4 sm:space-y-6">
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
          >
            <CreditCard
              className="h-5 w-5"
              style={{ color: currentTheme?.colors?.error || '#dc2626' }}
            />
            Project Expenses
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Expense
          </Button>
        </div>
        <div
          className="mb-4 p-3 rounded border"
          style={{
            backgroundColor: `${currentTheme?.colors?.primary?.[500] || '#3b82f6'}10`,
            borderColor: currentTheme?.colors?.primary?.[500] || '#3b82f6'
          }}
        >
          <p
            className="text-xs"
            style={{ color: currentTheme?.colors?.primary?.[700] || '#1d4ed8' }}
          >
            <strong>Note:</strong> Vendor expenses are tracked separately and do NOT affect customer payment balances.
          </p>
        </div>
        <ExpensesList
          projectId={project.id!}
          onEdit={(expense) => {
            setEditingExpense(expense);
            setIsExpenseModalOpen(true);
          }}
        />
      </Card>
    </div>
  );

  const timelineTab = (
    <Card
      className="p-4 sm:p-6"
      style={{
        backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
        borderColor: currentTheme?.colors?.background?.[600] || '#374151'
      }}
    >
      <p style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
        Project timeline and history will be displayed here
      </p>
    </Card>
  );

  const cashCalculationTab = <ProjectCashCalculation projectId={projectId} />;

  const tabs = [
    {
      label: 'Overview',
      content: overviewTab,
    },
    {
      label: 'Financial Summary',
      content: financialTab,
    },
    {
      label: 'Cash Calculation',
      content: cashCalculationTab,
    },
    {
      label: 'Payments',
      content: paymentsTab,
    },
    {
      label: 'Expenses',
      content: expensesTab,
    },
    {
      label: 'Timeline',
      content: timelineTab,
    },
  ];

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: currentTheme?.colors?.background?.[900] || '#111827' }}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${currentTheme?.colors?.error || '#dc2626'}20` }}
            >
              <Briefcase
                className="h-6 w-6 sm:h-8 sm:w-8"
                style={{ color: currentTheme?.colors?.error || '#dc2626' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-bold break-words"
                style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
              >
                {project.projectName}
              </h1>
              <p
                className="text-sm sm:text-base mt-1"
                style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
              >
                Project Details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${projectId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card
            className="p-4 sm:p-6 transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
              borderColor: currentTheme?.colors?.background?.[600] || '#374151'
            }}
          >
            <div className="flex items-center gap-3">
              <DollarSign
                className="h-8 w-8 sm:h-10 sm:w-10"
                style={{ color: currentTheme?.colors?.primary?.[600] || '#3b82f6' }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
                >
                  Total Amount
                </p>
                <p
                  className="text-lg sm:text-xl font-bold break-words"
                  style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                >
                  ₹{project.totalAmount?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 sm:p-6 transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
              borderColor: currentTheme?.colors?.background?.[600] || '#374151'
            }}
          >
            <div className="flex items-center gap-3">
              <FileText
                className="h-8 w-8 sm:h-10 sm:w-10"
                style={{ color: currentTheme?.colors?.accent?.[500] || '#10b981' }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
                >
                  Balance
                </p>
                <p
                  className="text-lg sm:text-xl font-bold break-words"
                  style={{ color: currentTheme?.colors?.warning || '#f59e0b' }}
                >
                  ₹{project.balanceAmount?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 sm:p-6 transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
              borderColor: currentTheme?.colors?.background?.[600] || '#374151'
            }}
          >
            <div className="flex items-center gap-3">
              <Clock
                className="h-8 w-8 sm:h-10 sm:w-10"
                style={{ color: currentTheme?.colors?.accent?.[400] || '#a855f7' }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
                >
                  Status
                </p>
                <div className="mt-1">
                  <StatusBadge status={project.status} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} />

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <ExpenseForm
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          projectId={project.id!}
          expense={editingExpense}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;
