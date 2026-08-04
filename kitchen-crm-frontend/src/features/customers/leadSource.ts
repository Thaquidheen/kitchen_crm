/**
 * Shared labels and formatting for a customer's two partner-related fields, reused by the form,
 * table, filters, and detail view so the wording stays consistent.
 *
 * They are separate on purpose. **Lead source** is one value recording the channel the customer
 * arrived through; **project network** is a list recording who is involved in the project. An
 * online lead can still have an architect on the job.
 *
 * Every read site must go through {@link customerLeadSource} or {@link customerProjectNetwork},
 * which cover the legacy shapes — nothing else should touch the deprecated fields.
 */
import type {
  Customer,
  LeadSourceType,
  ProjectNetworkMember,
  ProjectNetworkMemberType,
} from './types';

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

/** Lead sources offered in the form and filter dropdowns (legacy spellings excluded). */
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

export const leadSourceLabel = (type?: LeadSourceType): string =>
  (type && LEAD_SOURCE_LABELS[type]) || LEAD_SOURCE_LABELS.NONE;

/** The customer's lead source, defaulting to NONE for records that never had one set. */
export const customerLeadSource = (customer: Customer): LeadSourceType =>
  customer.leadSourceType ?? 'NONE';

// ---------------------------------------------------------------------------------------
// Project network
// ---------------------------------------------------------------------------------------

export const PROJECT_NETWORK_LABELS: Record<ProjectNetworkMemberType, string> = {
  ARCHITECT: 'Architect',
  BUILDER: 'Builder',
  REFERRAL: 'Referral',
};

/** Types a project-network entry can be set to. */
export const PROJECT_NETWORK_MEMBER_TYPES: { value: ProjectNetworkMemberType; label: string }[] = [
  { value: 'ARCHITECT', label: PROJECT_NETWORK_LABELS.ARCHITECT },
  { value: 'BUILDER', label: PROJECT_NETWORK_LABELS.BUILDER },
  { value: 'REFERRAL', label: PROJECT_NETWORK_LABELS.REFERRAL },
];

/** Members that link a reusable Architects-module record instead of carrying free text. */
export const isLinkedMember = (type?: ProjectNetworkMemberType): boolean =>
  type === 'ARCHITECT' || type === 'BUILDER';

export const memberTypeLabel = (type?: ProjectNetworkMemberType): string =>
  (type && PROJECT_NETWORK_LABELS[type]) || PROJECT_NETWORK_LABELS.REFERRAL;

/** The Architects-module record type a linked member points at. */
export const partnerTypeForMember = (type?: ProjectNetworkMemberType): 'ARCHITECT' | 'BUILDER' =>
  type === 'BUILDER' ? 'BUILDER' : 'ARCHITECT';

/**
 * Maps a pre-V95 sourceType onto a member type. Returns undefined for the values that described
 * a channel rather than a person — those belong to the lead source now.
 */
const memberTypeFromLegacy = (legacy?: string): ProjectNetworkMemberType | undefined => {
  switch (legacy) {
    case 'ARCHITECT':
      return 'ARCHITECT';
    case 'BUILDER':
      return 'BUILDER';
    case 'REFERRAL':
    case 'MANUAL':
    case 'MANUAL_REFERRAL':
    case 'BUILDER_REFERRAL':
    case 'CONSULTED':
      return 'REFERRAL';
    default:
      return undefined;
  }
};

/**
 * THE legacy bridge. Returns the customer's project network, reading `leadSources` when a
 * response predates the rename and falling back to the old flat columns for records saved
 * before the child table existed.
 */
export const customerProjectNetwork = (customer: Customer): ProjectNetworkMember[] => {
  // Present-but-empty is an answer, not a gap. Testing `.length` here instead would send a
  // customer whose network was just cleared down the legacy path below, resurrecting whoever
  // used to be in the flat columns.
  const rows = customer.projectNetwork ?? customer.leadSources;
  if (rows) {
    return [...rows]
      .map((row) => ({
        ...row,
        memberType:
          row.memberType ??
          memberTypeFromLegacy((row as { sourceType?: string }).sourceType) ??
          'REFERRAL',
      }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const legacyType = memberTypeFromLegacy(customer.leadSourceType);
  if (!legacyType) return [];

  const referralName = customer.referralName ?? customer.manualLeadName;
  if (legacyType === 'REFERRAL' && !referralName) return [];
  if (legacyType !== 'REFERRAL' && !customer.architectId && !referralName) return [];

  return [
    {
      memberType: legacyType,
      architectId: customer.architectId,
      architectName: customer.architectName,
      referralName,
      referralContact: customer.referralContact ?? customer.manualLeadContact,
      referralLocation: customer.referralLocation,
      referralDesignation: customer.referralDesignation,
      referralFirm: customer.referralFirm,
      referralEmail: customer.referralEmail,
    },
  ];
};

/** Who this member is — the linked record's name, else the typed name. */
export const memberWho = (row: ProjectNetworkMember): string | undefined =>
  isLinkedMember(row.memberType) ? row.architectName ?? row.referralName : row.referralName;

/** e.g. "Architect — Rahul Nair". */
export const memberLabel = (row: ProjectNetworkMember): string => {
  const label = memberTypeLabel(row.memberType);
  const who = memberWho(row);
  return who ? `${label} — ${who}` : label;
};

/** One-line summary of the whole network, for the table cell and CSV export. */
export const formatProjectNetwork = (customer: Customer): string => {
  const rows = customerProjectNetwork(customer);
  return rows.length ? rows.map(memberLabel).join(' · ') : '—';
};

/** Detail lines for one member, used in tooltips and the overview tab. */
export const memberDetailLines = (row: ProjectNetworkMember): string[] => {
  const linked = isLinkedMember(row.memberType);
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
