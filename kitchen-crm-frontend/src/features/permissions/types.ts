/** Every permission the administrator can set per staff type. Keys match the server's catalogue. */
export type PermissionKey =
  | 'customers.view'
  | 'customers.add'
  | 'customers.edit'
  | 'customers.delete'
  | 'customers.change_stage'
  | 'customers.bulk'
  | 'customers.export'
  | 'customers.followups'
  | 'customers.notes'
  | 'customers.reminders'
  | 'customers.upload_design'
  | 'customers.site_measurement'
  | 'customers.production'
  | 'customers.quotations';

/** What the signed-in person may do. */
export interface MyPermissions {
  superAdmin: boolean;
  /** ADMIN_STAFF | DESIGNER | SALES | NONE; null for a super admin. */
  staffType?: string | null;
  permissions: Record<string, boolean>;
}

export interface PermissionStaffType {
  key: string;
  label: string;
  /** Active staff of this type right now. */
  users: number;
}

export interface PermissionInfo {
  key: string;
  label: string;
  description: string;
  defaultAllowed: boolean;
  /** Only hides something on the screen; the server cannot enforce it. */
  screenOnly: boolean;
}

export interface PermissionModule {
  name: string;
  permissions: PermissionInfo[];
}

/** staff type -> permission key -> allowed */
export type PermissionValues = Record<string, Record<string, boolean>>;

export interface PermissionMatrix {
  staffTypes: PermissionStaffType[];
  modules: PermissionModule[];
  values: PermissionValues;
}
