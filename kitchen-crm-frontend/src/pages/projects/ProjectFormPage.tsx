/**
 * ProjectFormPage
 * Page for creating and editing projects
 */

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { useGetProjectByIdQuery } from '@/features/projects/projectsAPI';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const projectId = Number(id);
  const initialCustomerId = searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined;

  const { data: project, isLoading, error } = useGetProjectByIdQuery(projectId, {
    skip: !isEditMode || isNaN(projectId),
  });

  if (isEditMode && error) {
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

  if (isEditMode && isLoading) {
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
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: currentTheme?.colors?.background?.[900] || '#111827' }}
    >
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
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
              {isEditMode ? 'Edit Project' : 'New Project'}
            </h1>
            <p
              className="text-sm sm:text-base mt-1"
              style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
            >
              {isEditMode ? 'Update project details' : 'Create a new project'}
            </p>
          </div>
        </div>
      </div>

      <ProjectForm project={project} isEditMode={isEditMode} initialCustomerId={initialCustomerId} />
    </div>
  );
}

export default ProjectFormPage;
