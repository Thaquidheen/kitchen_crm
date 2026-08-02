/**
 * Architects feature types
 */

/**
 * Architects and builders share one table and one module, told apart by this field.
 * Records created before it existed have no value, so treat missing as ARCHITECT.
 */
export type PartnerType = 'ARCHITECT' | 'BUILDER';

export const partnerTypeOf = (a?: { partnerType?: PartnerType }): PartnerType =>
  a?.partnerType ?? 'ARCHITECT';

export const partnerTypeLabel = (type?: PartnerType): string =>
  type === 'BUILDER' ? 'Builder' : 'Architect';

export interface Architect {
  id: number;
  architectureName: string;
  partnerType?: PartnerType;
  firm?: string;
  contactNumber?: string;
  principalArchitectName?: string;
  lastVisitDate?: string;
  visitCount?: number;
  hasVisits?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArchitectCreate {
  architectureName: string;
  partnerType?: PartnerType;
  firm?: string;
  contactNumber?: string;
  principalArchitectName?: string;
}

export interface ArchitectUpdate {
  architectureName?: string;
  partnerType?: PartnerType;
  firm?: string;
  contactNumber?: string;
  principalArchitectName?: string;
}

export interface ArchitectVisit {
  id: number;
  architectId: number;
  visitDate: string;
  notes?: string;
  visitedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArchitectVisitCreate {
  architectId: number;
  visitDate: string;
  notes?: string;
  visitedBy?: string;
}




