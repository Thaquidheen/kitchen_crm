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
}

export interface StaffCreate {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface StaffUpdate {
  name?: string;
  email?: string;
  phoneNumber?: string;
  active?: boolean;
}







