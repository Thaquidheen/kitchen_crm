/**
 * ArchitectVisitHistory
 * Component to display visit history for an architect
 */

import { useState } from 'react';
import { useGetVisitHistoryQuery, useDeleteVisitMutation } from '../architectsAPI';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Calendar, User, FileText, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Architect, ArchitectVisit } from '../types';

interface ArchitectVisitHistoryProps {
  architect: Architect;
}

export function ArchitectVisitHistory({ architect }: ArchitectVisitHistoryProps) {
  const { data: visits, isLoading, error } = useGetVisitHistoryQuery(architect.id);
  const [deleteVisit, { isLoading: isDeleting }] = useDeleteVisitMutation();
  const [deleteTarget, setDeleteTarget] = useState<ArchitectVisit | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVisit({ architectId: architect.id, visitId: deleteTarget.id }).unwrap();
      toast.success('Visit removed');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || 'Failed to remove visit');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-background-700 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <p className="text-error">Failed to load visit history</p>
      </Card>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="text-center py-6 sm:py-8">
          <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-text-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-text-600 text-base sm:text-lg">No visits recorded yet</p>
          <p className="text-text-600 text-xs sm:text-sm mt-2">Start tracking visits to see history here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
      <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Visit History</h3>
      <div className="space-y-3 sm:space-y-4">
        {visits.map((visit) => (
          <div
            key={visit.id}
            className="p-3 sm:p-4 bg-background-700 border border-background-600 rounded-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-600 flex-shrink-0" />
                <span className="text-text-900 font-medium text-sm sm:text-base break-words">
                  {formatDate(visit.visitDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="text-xs sm:text-sm text-text-600">
                  {formatRelativeTime(visit.visitDate)}
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(visit)}
                  title="Remove this visit"
                  aria-label="Remove this visit"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 transition-colors"
                  onMouseEnter={(ev) => {
                    ev.currentTarget.style.background = 'var(--st-lost-bg)';
                    ev.currentTarget.style.color = 'var(--st-lost-fg)';
                  }}
                  onMouseLeave={(ev) => {
                    ev.currentTarget.style.background = 'transparent';
                    ev.currentTarget.style.color = '';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {visit.visitedBy && (
              <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-text-600">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">Visited by: {visit.visitedBy}</span>
              </div>
            )}
            
            {visit.notes && (
              <div className="mt-3 pt-3 border-t border-background-600">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-text-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-text-700 whitespace-pre-wrap break-words">{visit.notes}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nested Headless UI dialog — stacks above the history Modal */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Visit"
        message={
          deleteTarget
            ? `Remove the visit on ${formatDate(deleteTarget.visitDate)}? The last-visit date will fall back to the previous visit.`
            : ''
        }
        confirmText={isDeleting ? 'Removing…' : 'Remove'}
        type="danger"
      />
    </Card>
  );
}

export default ArchitectVisitHistory;






