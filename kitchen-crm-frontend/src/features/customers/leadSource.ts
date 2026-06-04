/**
 * Shared lead-source labels and formatting, reused by the form, table, filters,
 * and detail view so the wording stays consistent.
 */
import type { Customer, LeadSourceType } from './types';

export const LEAD_SOURCE_LABELS: Record<LeadSourceType, string> = {
  NONE: 'No Lead',
  ARCHITECT: 'Architect',
  MANUAL: 'Manual', // legacy
  ONLINE: 'Online Lead',
  WALK_IN: 'Walk-in',
  SCOUTING: 'Scouting',
  BUILDER_REFERRAL: 'Builder Referral',
  MANUAL_REFERRAL: 'Manual Referral',
};

/** Lead sources offered in the create/edit form (legacy MANUAL excluded). */
export const SELECTABLE_LEAD_SOURCES: { value: LeadSourceType; label: string }[] = [
  { value: 'NONE', label: LEAD_SOURCE_LABELS.NONE },
  { value: 'ARCHITECT', label: 'Select Architect' },
  { value: 'WALK_IN', label: LEAD_SOURCE_LABELS.WALK_IN },
  { value: 'SCOUTING', label: LEAD_SOURCE_LABELS.SCOUTING },
  { value: 'ONLINE', label: LEAD_SOURCE_LABELS.ONLINE },
  { value: 'BUILDER_REFERRAL', label: LEAD_SOURCE_LABELS.BUILDER_REFERRAL },
  { value: 'MANUAL_REFERRAL', label: LEAD_SOURCE_LABELS.MANUAL_REFERRAL },
];

/** Lead sources that carry referrer details (name/number/location/designation). */
export const REFERRAL_LEAD_SOURCES: LeadSourceType[] = ['BUILDER_REFERRAL', 'MANUAL_REFERRAL'];

export const isReferralSource = (type?: LeadSourceType): boolean =>
  !!type && REFERRAL_LEAD_SOURCES.includes(type);

export const leadSourceLabel = (type?: LeadSourceType): string =>
  (type && LEAD_SOURCE_LABELS[type]) || LEAD_SOURCE_LABELS.NONE;

/** Compact one-line summary for the table cell, e.g. "Builder Referral — Ramesh, 98xxx". */
export const formatLeadSource = (customer: Customer): string => {
  const label = leadSourceLabel(customer.leadSourceType);
  if (customer.leadSourceType === 'ARCHITECT' && customer.architectName) {
    return `${label} — ${customer.architectName}`;
  }
  if (isReferralSource(customer.leadSourceType)) {
    const parts = [customer.referralName, customer.referralContact].filter(Boolean);
    return parts.length ? `${label} — ${parts.join(', ')}` : label;
  }
  // Legacy manual records
  if (customer.leadSourceType === 'MANUAL' && customer.manualLeadName) {
    return `Manual Referral — ${customer.manualLeadName}`;
  }
  return label;
};

/** Full referrer detail lines for tooltips / detail view. Empty array if not a referral. */
export const referralDetailLines = (customer: Customer): string[] => {
  if (!isReferralSource(customer.leadSourceType) && customer.leadSourceType !== 'MANUAL') {
    return [];
  }
  const name = customer.referralName ?? customer.manualLeadName;
  const contact = customer.referralContact ?? customer.manualLeadContact;
  return [
    name ? `Name: ${name}` : '',
    contact ? `Number: ${contact}` : '',
    customer.referralLocation ? `Location: ${customer.referralLocation}` : '',
    customer.referralDesignation ? `Designation: ${customer.referralDesignation}` : '',
  ].filter(Boolean);
};
