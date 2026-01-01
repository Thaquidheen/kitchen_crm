/**
 * Production & Installation utility functions and constants
 */

import { InstallationStatus } from '../types';
import type { InstallationStatusOption } from '../types';

export const INSTALLATION_STATUS_OPTIONS: InstallationStatusOption[] = [
  {
    value: InstallationStatus.NOT_STARTED,
    label: 'Not Started',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500',
    description: 'Production not yet started',
  },
  {
    value: InstallationStatus.PRODUCTION,
    label: 'Production',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500',
    description: 'Manufacturing in progress',
  },
  {
    value: InstallationStatus.SITE_PREPARATION,
    label: 'Site Preparation',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500',
    description: 'Site preparation phase',
  },
  {
    value: InstallationStatus.DELIVERY,
    label: 'Delivery',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500',
    description: 'Materials being delivered',
  },
  {
    value: InstallationStatus.INSTALLATION,
    label: 'Installation',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    description: 'Installation in progress',
  },
  {
    value: InstallationStatus.QUALITY_CHECK,
    label: 'Quality Check',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
    description: 'Quality inspection phase',
  },
  {
    value: InstallationStatus.COMPLETED,
    label: 'Completed',
    color: 'bg-green-500/20 text-green-400 border-green-500',
    description: 'Project completed',
  },
  {
    value: InstallationStatus.ON_HOLD,
    label: 'On Hold',
    color: 'bg-yellow-600/20 text-yellow-500 border-yellow-600',
    description: 'Temporarily paused',
  },
  {
    value: InstallationStatus.CANCELLED,
    label: 'Cancelled',
    color: 'bg-red-500/20 text-red-400 border-red-500',
    description: 'Project cancelled',
  },
];

export const getStatusColor = (status: InstallationStatus): string => {
  const option = INSTALLATION_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.color || 'bg-gray-500/20 text-gray-400 border-gray-500';
};

export const getStatusLabel = (status: InstallationStatus): string => {
  const option = INSTALLATION_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status.replace(/_/g, ' ');
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};







