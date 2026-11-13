import { describe, expect, it } from 'vitest';
import {
  applyModuleToPerson,
  applyModuleToType,
  appliesTo,
  blockedBy,
  blockedByAnswer,
  changedValues,
  clearOverride,
  countChanges,
  isAllowed,
  isOnDefaults,
  moduleSwitchNext,
  moduleSwitchState,
  personAnswer,
  personChanges,
} from './permissionRules';
import type { MyPermissions, PermissionInfo, PermissionMatrix, PermissionModule } from './types';

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

describe('one click for a whole module', () => {
  const p = (key: string, extra: Partial<PermissionInfo> = {}): PermissionInfo => ({
    key,
    label: key,
    description: '',
    defaultAllowed: true,
    screenOnly: false,
    ...extra,
  });
  const quotations: PermissionModule = {
    name: 'Quotation work',
    permissions: [
      p('quotation_work.view'),
      p('quotation_work.prepare'),
      p('quotation_work.assign', { appliesTo: ['ADMIN_STAFF'] }),
    ],
  };
  const adminOnly: PermissionModule = { name: 'Assigning', permissions: [p('quotation_work.assign', { appliesTo: ['ADMIN_STAFF'] })] };
  const typeAnswer = (row: Record<string, boolean>) => (x: PermissionInfo) => row[x.key] === true;

  it('is on, off or mixed over the permissions the staff type can have, and none when there are none', () => {
    // The assign switch is not for designers, so it does not make the designer column mixed.
    expect(moduleSwitchState(quotations, 'DESIGNER', typeAnswer({ 'quotation_work.view': true, 'quotation_work.prepare': true }))).toBe('on');
    expect(moduleSwitchState(quotations, 'DESIGNER', typeAnswer({}))).toBe('off');
    expect(moduleSwitchState(quotations, 'DESIGNER', typeAnswer({ 'quotation_work.view': true }))).toBe('mixed');
    expect(
      moduleSwitchState(quotations, 'ADMIN_STAFF', typeAnswer({ 'quotation_work.view': true, 'quotation_work.prepare': true })),
    ).toBe('mixed');
    expect(moduleSwitchState(adminOnly, 'DESIGNER', typeAnswer({}))).toBe('none');
  });

  it('turns everything on from off or mixed, and off from on', () => {
    expect(moduleSwitchNext('off')).toBe(true);
    expect(moduleSwitchNext('mixed')).toBe(true);
    expect(moduleSwitchNext('on')).toBe(false);
  });

  it('sets only the permissions the staff type can have, and leaves other columns and modules alone', () => {
    const values = {
      DESIGNER: { 'quotation_work.view': false, 'quotation_work.prepare': true, 'customers.view': true },
      SALES: { 'quotation_work.view': true },
    };
    const next = applyModuleToType(values, quotations, 'DESIGNER', true);
    expect(next.DESIGNER).toEqual({ 'quotation_work.view': true, 'quotation_work.prepare': true, 'customers.view': true });
    expect(next.SALES).toBe(values.SALES);
    expect(values.DESIGNER['quotation_work.view']).toBe(false); // the saved answers are not touched
    expect(applyModuleToType(values, quotations, 'DESIGNER', false).DESIGNER).toEqual({
      'quotation_work.view': false,
      'quotation_work.prepare': false,
      'customers.view': true,
    });
    expect(applyModuleToType({}, quotations, 'ADMIN_STAFF', true).ADMIN_STAFF).toEqual({
      'quotation_work.view': true,
      'quotation_work.prepare': true,
      'quotation_work.assign': true,
    });
  });
});

describe('one person on top of their staff type', () => {
  const p = (key: string, extra: Partial<PermissionInfo> = {}): PermissionInfo => ({
    key,
    label: key,
    description: '',
    defaultAllowed: true,
    screenOnly: false,
    ...extra,
  });
  const view = p('designs.view');
  const work = p('designs.work', { requires: 'designs.view' });
  const assign = p('quotation_work.assign', { appliesTo: ['ADMIN_STAFF'] });
  const designs: PermissionModule = { name: 'Designs', permissions: [view, work, assign] };
  const typeValues = { 'designs.view': true, 'designs.work': true, 'quotation_work.assign': false };

  it('takes what is set for the person, else what the staff type says', () => {
    expect(personAnswer(view, 'DESIGNER', typeValues, {})).toBe(true);
    expect(personAnswer(view, 'DESIGNER', typeValues, { 'designs.view': false })).toBe(false);
    expect(personAnswer(work, 'DESIGNER', { 'designs.work': false }, { 'designs.work': true })).toBe(true);
  });

  it('never gives a permission that is not for their staff type, whatever was set before', () => {
    expect(personAnswer(assign, 'DESIGNER', typeValues, { 'quotation_work.assign': true })).toBe(false);
    expect(personAnswer(assign, 'ADMIN_STAFF', typeValues, { 'quotation_work.assign': true })).toBe(true);
  });

  it('switches a whole module for the person, only where their staff type can have it', () => {
    const next = applyModuleToPerson({ 'customers.view': false }, designs, 'DESIGNER', false);
    expect(next).toEqual({ 'customers.view': false, 'designs.view': false, 'designs.work': false });
    const answer = (x: PermissionInfo) => personAnswer(x, 'DESIGNER', typeValues, next);
    expect(moduleSwitchState(designs, 'DESIGNER', answer)).toBe('off');
    expect(moduleSwitchState(designs, 'DESIGNER', (x) => personAnswer(x, 'DESIGNER', typeValues, {}))).toBe('on');
    expect(
      moduleSwitchState(designs, 'DESIGNER', (x) => personAnswer(x, 'DESIGNER', typeValues, { 'designs.work': false })),
    ).toBe('mixed');
  });

  it('names the permission that is off for the person', () => {
    const answer = (o: Record<string, boolean>) => (x: PermissionInfo) => personAnswer(x, 'DESIGNER', typeValues, o);
    expect(blockedByAnswer([designs], work, answer({ 'designs.view': false }))?.key).toBe('designs.view');
    expect(blockedByAnswer([designs], work, answer({}))).toBeNull();
  });

  it('sends only what changed, with null for "use staff type"', () => {
    const saved = { 'designs.view': false, 'designs.work': true };
    expect(personChanges(saved, saved)).toEqual({});
    expect(personChanges(saved, { 'designs.view': true, 'designs.work': true })).toEqual({ 'designs.view': true });
    expect(personChanges(saved, clearOverride(saved, 'designs.view'))).toEqual({ 'designs.view': null });
    expect(personChanges({}, { 'customers.view': false })).toEqual({ 'customers.view': false });
    expect(clearOverride(saved, 'designs.view')).toEqual({ 'designs.work': true });
    expect(saved).toEqual({ 'designs.view': false, 'designs.work': true }); // not touched
  });
});
