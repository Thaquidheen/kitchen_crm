/**
 * Shared lead-source labels and formatting, reused by the form, table, filters,
 * and detail view so the wording stays consistent.
 *
 * A customer has a LIST of lead sources. Every read site must go through
 * {@link customerLeadSourceRows}, which also synthesises a row from the legacy flat fields
 * for records that predate the change — nothing else should touch those fields.
 */
import type { Customer, CustomerLeadSource, LeadSourceType } from './types';

export const LEAD_SOURCE_LABELS: Record<LeadSourceType, string> = {
  NONE: 'No Lead',
  ARCHITECT: 'Architect',
  BUILDER: 'Builder',
  MANUAL: 'Manual', // legacy
  ONLINE: 'Online Lead',
  WALK_IN: 'Walk-in',
  SCOUTING: 'Scouting',
  BUILDER_REFERRAL: 'Builder (referral)', // legacy free-text builder, superseded by BUILDER
  MANUAL_REFERRAL: 'Referral',
  CONSULTED: 'Consulted',
};

/** Lead sources offered in the filter dropdown (legacy MANUAL and BUILDER_REFERRAL excluded). */
export const SELECTABLE_LEAD_SOURCES: { value: LeadSourceType; label: string }[] = [
  { value: 'NONE', label: LEAD_SOURCE_LABELS.NONE },
  { value: 'ARCHITECT', label: LEAD_SOURCE_LABELS.ARCHITECT },
  { value: 'BUILDER', label: LEAD_SOURCE_LABELS.BUILDER },
  { value: 'CONSULTED', label: LEAD_SOURCE_LABELS.CONSULTED },
  { value: 'MANUAL_REFERRAL', label: LEAD_SOURCE_LABELS.MANUAL_REFERRAL },
  { value: 'WALK_IN', label: LEAD_SOURCE_LABELS.WALK_IN },
  { value: 'SCOUTING', label: LEAD_SOURCE_LABELS.SCOUTING },
  { value: 'ONLINE', label: LEAD_SOURCE_LABELS.ONLINE },
];

/**
 * Types a lead-source row can be set to. NONE is absent on purpose — an empty list is how
 * "no lead source" is represented. BUILDER_REFERRAL and MANUAL are legacy: existing rows still
 * display, but neither can be chosen for a new one.
 */
export const LEAD_SOURCE_ROW_TYPES: { value: LeadSourceType; label: string }[] =
  SELECTABLE_LEAD_SOURCES.filter((s) => s.value !== 'NONE');

/** Sources that link a reusable Architects-module record instead of carrying free text. */
export const LINKED_LEAD_SOURCES: LeadSourceType[] = ['ARCHITECT', 'BUILDER'];

/** Sources that carry free-text referrer details. */
export const FREE_TEXT_LEAD_SOURCES: LeadSourceType[] = [
  'BUILDER_REFERRAL',
  'MANUAL_REFERRAL',
  'CONSULTED',
  'MANUAL',
];

export const isLinkedSource = (type?: LeadSourceType): boolean =>
  !!type && LINKED_LEAD_SOURCES.includes(type);

export const isFreeTextSource = (type?: LeadSourceType): boolean =>
  !!type && FREE_TEXT_LEAD_SOURCES.includes(type);

export const leadSourceLabel = (type?: LeadSourceType): string =>
  (type && LEAD_SOURCE_LABELS[type]) || LEAD_SOURCE_LABELS.NONE;

/** The Architects-module record type a linked source points at. */
export const partnerTypeForSource = (type?: LeadSourceType): 'ARCHITECT' | 'BUILDER' =>
  type === 'BUILDER' ? 'BUILDER' : 'ARCHITECT';

/**
 * THE legacy bridge. Returns the customer's lead-source rows, falling back to a single row
 * synthesised from the old flat columns for records saved before the change.
 */
export const customerLeadSourceRows = (customer: Customer): CustomerLeadSource[] => {
  if (customer.leadSources?.length) {
    return [...customer.leadSources].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const type = customer.leadSourceType;
  if (!type || type === 'NONE') return [];

  if (type === 'MANUAL') {
    return [
      {
        sourceType: 'MANUAL_REFERRAL',
        referralName: customer.referralName ?? customer.manualLeadName,
        referralContact: customer.referralContact ?? customer.manualLeadContact,
      },
    ];
  }

  return [
    {
      sourceType: type,
      architectId: customer.architectId,
      architectName: customer.architectName,
      referralName: customer.referralName,
      referralContact: customer.referralContact,
      referralLocation: customer.referralLocation,
      referralDesignation: customer.referralDesignation,
      referralFirm: customer.referralFirm,
      referralEmail: customer.referralEmail,
    },
  ];
};

/** Who this source is, if known — the linked record's name, else the typed referrer name. */
export const leadSourceWho = (row: CustomerLeadSource): string | undefined =>
  isLinkedSource(row.sourceType) ? row.architectName ?? row.referralName : row.referralName;

/** e.g. "Architect — Rahul Nair". */
export const leadSourceRowLabel = (row: CustomerLeadSource): string => {
  const label = leadSourceLabel(row.sourceType);
  const who = leadSourceWho(row);
  return who ? `${label} — ${who}` : label;
};

/** One-line summary of every source, for the table cell and CSV export. */
export const formatLeadSources = (customer: Customer): string => {
  const rows = customerLeadSourceRows(customer);
  return rows.length ? rows.map(leadSourceRowLabel).join(' · ') : LEAD_SOURCE_LABELS.NONE;
};

/** Detail lines for one source, used in tooltips and the overview tab. */
export const leadSourceDetailLines = (row: CustomerLeadSource): string[] => {
  const linked = isLinkedSource(row.sourceType);
  const firm = linked ? row.architectFirm ?? row.referralFirm : row.referralFirm;
  const contact = linked ? row.architectContact ?? row.referralContact : row.referralContact;
  return [
    firm ? `Firm: ${firm}` : '',
    contact ? `Phone: ${contact}` : '',
    row.referralEmail ? `Email: ${row.referralEmail}` : '',
    row.referralLocation ? `Location: ${row.referralLocation}` : '',
    row.referralDesignation ? `Designation: ${row.referralDesignation}` : '',
  ].filter(Boolean);
};
