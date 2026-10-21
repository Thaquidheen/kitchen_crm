import { describe, expect, it } from 'vitest';
import { quotationAccess } from './quotationAccess';
import { isAllowed } from '@/features/permissions/permissionRules';
import type { MyPermissions, PermissionKey } from '@/features/permissions/types';

const ALL: PermissionKey[] = [
  'quotations.view',
  'quotations.create',
  'quotations.edit',
  'quotations.delete',
  'quotations.change_status',
  'quotations.pdf',
  'quotations.see_rates',
  'quotations.see_margins',
  'quotations.edit_margins',
];

/** A staff member allowed exactly these. */
const staff = (...allowed: PermissionKey[]) => {
  const mine: MyPermissions = {
    superAdmin: false,
    staffType: 'DESIGNER',
    permissions: Object.fromEntries(ALL.map((k) => [k, allowed.includes(k)])),
  };
  return quotationAccess((key) => isAllowed(false, mine, key));
};

describe('quotationAccess', () => {
  it('gives the administrator everything but choosing codes (the administrator types percentages)', () => {
    const a = quotationAccess((key) => isAllowed(true, undefined, key), true);
    const { picksMarginCodes, ...rest } = a;
    expect(Object.values(rest).every(Boolean)).toBe(true);
    expect(picksMarginCodes).toBe(false);
  });

  it('gives nothing before the permissions are known', () => {
    const a = quotationAccess((key) => isAllowed(false, undefined, key));
    expect(Object.values(a).some(Boolean)).toBe(false);
  });

  it('maps each action to its own permission', () => {
    expect(staff('quotations.view')).toMatchObject({ view: true, create: false, edit: false, remove: false });
    expect(staff('quotations.create').create).toBe(true);
    expect(staff('quotations.edit').edit).toBe(true);
    expect(staff('quotations.delete').remove).toBe(true);
    expect(staff('quotations.change_status').changeStatus).toBe(true);
    expect(staff('quotations.pdf').pdf).toBe(true);
    // one permission never brings another with it
    expect(staff('quotations.edit')).toMatchObject({ create: false, remove: false, changeStatus: false, seesRates: false });
  });

  it('keeps rates and margins apart; staff see margins as codes, never percentages', () => {
    expect(staff('quotations.see_rates')).toMatchObject({ seesRates: true, seesMargins: false, seesMarginCodes: false });
    expect(staff('quotations.see_margins')).toMatchObject({ seesRates: false, seesMargins: false, seesMarginCodes: true });
  });

  it('lets staff choose codes only with both margin permissions, and never type percentages', () => {
    expect(staff('quotations.edit_margins').picksMarginCodes).toBe(false);
    expect(staff('quotations.see_rates', 'quotations.edit_margins').picksMarginCodes).toBe(false);
    expect(staff('quotations.see_margins', 'quotations.edit_margins')).toMatchObject({ picksMarginCodes: true, editsMargins: false });
  });

  it('lets the screen work totals out only for the administrator (staff have no percentages)', () => {
    expect(staff().computesTotals).toBe(false);
    expect(staff('quotations.see_rates', 'quotations.see_margins', 'quotations.edit_margins').computesTotals).toBe(false);
    expect(quotationAccess((key) => isAllowed(true, undefined, key), true).computesTotals).toBe(true);
  });
});
