/**
 * Breadcrumb Component
 * Navigation breadcrumbs
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import clsx from 'clsx';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav
      className={clsx('flex items-center gap-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="flex items-center text-white-600 hover:text-white-900 transition-colors"
      >
        <Home size={16} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight size={16} className="text-white-600" />
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-white-600 hover:text-white-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={clsx(
                  isLast ? 'text-white-900 font-medium' : 'text-white-600'
                )}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
