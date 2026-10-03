/**
 * Staff feature types
 */

export interface Staff {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  active: boolean;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
  /** SALES | DESIGNER | ADMIN_STAFF — a label, not a login role. */
  staffType?: 'SALES' | 'DESIGNER' | 'ADMIN_STAFF' | null;
  /** Set by an admin for designers: AVAILABLE | BUSY | ON_LEAVE. */
  designerStatus?: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE' | null;
}

export interface StaffCreate {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  staffType?: string;
}

export interface StaffUpdate {
  name?: string;
  email?: string;
  phoneNumber?: string;
  active?: boolean;
  /** Blank clears the type. */
  staffType?: string;
}







