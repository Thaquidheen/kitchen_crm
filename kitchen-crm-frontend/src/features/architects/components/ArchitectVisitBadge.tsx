/**
 * ArchitectVisitBadge
 * Visual indicator showing visit status for an architect
 */

import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock } from 'lucide-react';

interface ArchitectVisitBadgeProps {
  lastVisitDate?: string;
  hasVisits?: boolean;
  className?: string;
}

export function ArchitectVisitBadge({ lastVisitDate, hasVisits, className }: ArchitectVisitBadgeProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (!hasVisits || !lastVisitDate) {
    return (
      <Badge variant="default" className={className}>
        <Clock className="h-3 w-3 mr-1" />
        Not Visited
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={className}>
      <Calendar className="h-3 w-3 mr-1" />
      Visited {formatDate(lastVisitDate)}
    </Badge>
  );
}

export default ArchitectVisitBadge;







