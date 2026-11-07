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
  | 'customers.quotations'
  | 'quotations.view'
  | 'quotations.create'
  | 'quotations.edit'
  | 'quotations.delete'
  | 'quotations.change_status'
  | 'quotations.pdf'
  | 'quotations.see_rates'
  | 'quotations.see_margins'
  | 'quotations.edit_margins'
  | 'quotations.send_for_approval'
  | 'quotation_work.view'
  | 'quotation_work.prepare'
  | 'quotation_work.assign'
  | 'quotation_work.change'
  | 'quotation_work.remove'
  | 'appliance.view'
  | 'appliance.add'
  | 'appliance.edit'
  | 'appliance.delete'
  | 'appliance.files'
  | 'appliance.followups'
  | 'appliance.reminders'
  | 'reminders.view'
  | 'reminders.edit'
  | 'reminders.done'
  | 'reminders.delete'
  | 'tasks.todos'
  | 'tasks.mine'
  | 'designs.view'
  | 'designs.add_plans'
  | 'designs.upload_files'
  | 'designs.remove_files'
  | 'designs.work'
  | 'designs.conversation'
  | 'production.view'
  | 'production.start'
  | 'production.tick'
  | 'production.checklist'
  | 'production.checklist_delete'
  | 'production.reminders'
  | 'production.pending_works'
  | 'production.edit_job'
  | 'products.view'
  | 'vendors.view'
  | 'vendors.add'
  | 'vendors.edit'
  | 'vendors.deactivate'
  | 'architects.view'
  | 'architects.add'
  | 'architects.edit'
  | 'architects.delete'
  | 'architects.visits'
  | 'architects.reminders';

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
  /** Key of the permission this one only works together with. */
  requires?: string | null;
  /** The staff types it can be given to; missing when it is for every type. */
  appliesTo?: string[] | null;
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
