/**
 * Architects feature types
 */

export interface Architect {
  id: number;
  architectureName: string;
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
  firm?: string;
  contactNumber?: string;
  principalArchitectName?: string;
}

export interface ArchitectUpdate {
  architectureName?: string;
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




