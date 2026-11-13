import { describe, expect, it } from 'vitest';
import { appliesTo, blockedBy, changedValues, countChanges, isAllowed, isOnDefaults } from './permissionRules';
import type { MyPermissions, PermissionMatrix } from './types';

const mine = (permissions: Record<string, boolean>): MyPermissions => ({ superAdmin: false, staffType: 'DESIGNER', permissions });

describe('isAllowed', () => {
  it('lets a super admin do everything, even before anything is loaded', () => {
    expect(isAllowed(true, undefined, 'customers.delete')).toBe(true);
    expect(isAllowed(true, mine({ 'customers.delete': false }), 'customers.delete')).toBe(true);
  });

  it('gives staff exactly what their staff type allows', () => {
    const p = mine({ 'customers.edit': true, 'customers.delete': false });
    expect(isAllowed(false, p, 'customers.edit')).toBe(true);
    expect(isAllowed(false, p, 'customers.delete')).toBe(false);
  });

  it('says no while the answers are not known, and for a permission that is not listed', () => {
    expect(isAllowed(false, undefined, 'customers.edit')).toBe(false);
    expect(isAllowed(false, mine({}), 'customers.edit')).toBe(false);
  });
});

describe('changedValues', () => {
  const saved = { DESIGNER: { 'customers.edit': true, 'customers.delete': false }, SALES: { 'customers.edit': true } };

  it('keeps only the answers that differ from what is saved', () => {
    const edited = { DESIGNER: { 'customers.edit': false, 'customers.delete': false }, SALES: { 'customers.edit': true } };
    expect(changedValues(saved, edited)).toEqual({ DESIGNER: { 'customers.edit': false } });
    expect(countChanges(changedValues(saved, edited))).toBe(1);
  });

  it('is empty when nothing was touched, or a switch was put back', () => {
    expect(changedValues(saved, saved)).toEqual({});
    expect(countChanges({})).toBe(0);
  });

  it('counts across staff types', () => {
    const edited = { DESIGNER: { 'customers.edit': false, 'customers.delete': true }, SALES: { 'customers.edit': false } };
    expect(countChanges(changedValues(saved, edited))).toBe(3);
  });
});

describe('isOnDefaults', () => {
  const matrix: PermissionMatrix = {
    staffTypes: [{ key: 'DESIGNER', label: 'Designer', users: 1 }],
    modules: [
      {
        name: 'Customers',
        permissions: [
          { key: 'customers.edit', label: 'Edit', description: '', defaultAllowed: true, screenOnly: false },
          { key: 'customers.delete', label: 'Delete', description: '', defaultAllowed: false, screenOnly: false },
        ],
      },
    ],
    values: {},
  };

  it('is true only when every answer equals its default', () => {
    expect(isOnDefaults(matrix, { DESIGNER: { 'customers.edit': true, 'customers.delete': false } }, 'DESIGNER')).toBe(true);
    expect(isOnDefaults(matrix, { DESIGNER: { 'customers.edit': true, 'customers.delete': true } }, 'DESIGNER')).toBe(false);
  });
});

describe('permissions limited to some staff types, and ones that need another', () => {
  const p = (key: string, extra: Partial<import('./types').PermissionInfo> = {}) => ({
    key,
    label: key,
    description: '',
    defaultAllowed: true,
    screenOnly: false,
    ...extra,
  });
  const matrix: PermissionMatrix = {
    staffTypes: [
      { key: 'ADMIN_STAFF', label: 'Admin staff', users: 1 },
      { key: 'SALES', label: 'Sales', users: 1 },
    ],
    modules: [
      {
        name: 'Production',
        permissions: [
          p('customers.production'),
          p('production.tick', { requires: 'customers.production' }),
          p('quotation_work.assign', { appliesTo: ['ADMIN_STAFF'] }),
        ],
      },
    ],
    values: {},
  };

  it('has no switch for a staff type it is not for, and ignores that type on "Use defaults"', () => {
    expect(appliesTo(matrix.modules[0].permissions[2], 'ADMIN_STAFF')).toBe(true);
    expect(appliesTo(matrix.modules[0].permissions[2], 'SALES')).toBe(false);
    expect(appliesTo(matrix.modules[0].permissions[0], 'SALES')).toBe(true);
    const values = { SALES: { 'customers.production': true, 'production.tick': true, 'quotation_work.assign': false } };
    expect(isOnDefaults(matrix, values, 'SALES')).toBe(true);
  });

  it('names the permission that is off and makes a switch do nothing', () => {
    const tick = matrix.modules[0].permissions[1];
    expect(blockedBy(matrix, { SALES: { 'customers.production': false, 'production.tick': true } }, tick, 'SALES')?.key).toBe(
      'customers.production',
    );
    expect(blockedBy(matrix, { SALES: { 'customers.production': true, 'production.tick': true } }, tick, 'SALES')).toBeNull();
    expect(blockedBy(matrix, {}, matrix.modules[0].permissions[0], 'SALES')).toBeNull();
  });
});
