import { describe, expect, it } from 'vitest';
import {
  EMPTY_DRAFT,
  NO_EDITS,
  buildChanges,
  choiceText,
  countStatuses,
  draftOf,
  editProblems,
  hasEntry,
  isSheetEmpty,
  joinChoice,
  liveCounts,
  nextStatus,
  parseChoice,
  parseQuantity,
  sameDraft,
  sectionRows,
  shownItems,
  toggleChoice,
  type SheetEdits,
} from './requirementSheetRules';
import type { RequirementItem, RequirementSheet } from './requirementSheetAPI';

const BURNER = [
  ['30 cm', '60 cm', '90 cm'],
  ['Built-in', 'Freestanding'],
];

const item = (over: Partial<RequirementItem>): RequirementItem => ({
  key: 'units.sink',
  label: 'Sink Unit',
  custom: false,
  options: [],
  status: null,
  choice: null,
  quantity: null,
  note: null,
  ...over,
});

const sheet = (): RequirementSheet => ({
  customerId: 7,
  customerName: 'Mr. Joseph',
  counts: { needed: 1, notNeeded: 0, unmarked: 3 },
  sections: [
    {
      key: 'units',
      title: 'Kitchen Units',
      items: [
        item({ key: 'units.sink', status: 'NEEDED', quantity: 1 }),
        item({ key: 'units.hob', label: 'Hob Unit' }),
        item({ key: 'custom.ab12cd34', label: 'Bar counter', custom: true, note: 'by the window' }),
      ],
    },
    {
      key: 'appliances',
      title: 'Appliances',
      items: [item({ key: 'appliances.burner', label: 'Burner', options: BURNER })],
    },
  ],
});

const edits = (over: Partial<SheetEdits>): SheetEdits => ({ ...NO_EDITS, ...over });

describe('marking an item', () => {
  it('sets the mark clicked, and clicking it again clears it', () => {
    expect(nextStatus(null, 'NEEDED')).toBe('NEEDED');
    expect(nextStatus('NEEDED', 'NOT_NEEDED')).toBe('NOT_NEEDED');
    expect(nextStatus('NEEDED', 'NEEDED')).toBeNull();
  });
  it('counts needed, not needed and not marked', () => {
    expect(countStatuses(['NEEDED', null, 'NOT_NEEDED', 'NEEDED', null])).toEqual({ needed: 2, notNeeded: 1, unmarked: 2 });
  });
});

describe('quick choices', () => {
  it('reads and writes the saved text in option order', () => {
    expect(parseChoice('60 cm, Built-in')).toEqual(['60 cm', 'Built-in']);
    expect(parseChoice(null)).toEqual([]);
    expect(joinChoice(BURNER, ['Built-in', '60 cm'])).toBe('60 cm,Built-in');
    expect(joinChoice(BURNER, ['Unknown'])).toBeNull();
    expect(choiceText('60 cm,Built-in')).toBe('60 cm, Built-in');
  });
  it('keeps one choice per group and clears a choice clicked again', () => {
    expect(toggleChoice(BURNER, null, 'Built-in')).toBe('Built-in');
    expect(toggleChoice(BURNER, 'Built-in', '90 cm')).toBe('90 cm,Built-in');
    expect(toggleChoice(BURNER, '90 cm,Built-in', '30 cm')).toBe('30 cm,Built-in');
    expect(toggleChoice(BURNER, '30 cm,Built-in', 'Freestanding')).toBe('30 cm,Freestanding');
    expect(toggleChoice(BURNER, '30 cm,Freestanding', '30 cm')).toBe('Freestanding');
    expect(toggleChoice(BURNER, 'Freestanding', 'Freestanding')).toBeNull();
  });
});

describe('quantities', () => {
  it('accepts empty, whole and decimal numbers', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity(' 3 ')).toBe(3);
    expect(parseQuantity('2.5')).toBe(2.5);
    expect(parseQuantity('1.239')).toBe(1.24);
  });
  it('refuses letters, negatives and numbers too big', () => {
    expect(parseQuantity('abc')).toBeUndefined();
    expect(parseQuantity('-1')).toBeUndefined();
    expect(parseQuantity('.')).toBeUndefined();
    expect(parseQuantity('100000000')).toBeUndefined();
  });
});

describe('what changed', () => {
  it('treats the same answers typed differently as unchanged', () => {
    const saved = draftOf(item({ quantity: 2, note: 'tall' }));
    expect(sameDraft(saved, { ...saved, quantity: '2.0', note: ' tall ' })).toBe(true);
    expect(sameDraft(saved, { ...saved, quantity: '3' })).toBe(false);
    expect(hasEntry(item({}))).toBe(false);
    expect(hasEntry(item({ note: 'x' }))).toBe(true);
  });

  it('sends nothing when nothing changed, or an item was put back as it was', () => {
    const s = sheet();
    expect(buildChanges(s, NO_EDITS)).toEqual([]);
    expect(buildChanges(s, edits({ drafts: { 'units.sink': { status: 'NEEDED', choice: null, quantity: '1', note: '' } } }))).toEqual([]);
  });

  it('sends only the changed items, each with all its answers', () => {
    const changes = buildChanges(
      sheet(),
      edits({
        drafts: {
          'units.sink': EMPTY_DRAFT,
          'appliances.burner': { status: 'NEEDED', choice: '60 cm,Built-in', quantity: '1', note: ' 4 burners ' },
          'custom.ab12cd34': { status: 'NOT_NEEDED', choice: null, quantity: '', note: 'by the window' },
        },
      }),
    );
    expect(changes).toEqual([
      { key: 'units.sink', section: 'units', status: null, choice: null, quantity: null, note: null },
      { key: 'custom.ab12cd34', section: 'units', label: 'Bar counter', status: 'NOT_NEEDED', choice: null, quantity: null, note: 'by the window' },
      { key: 'appliances.burner', section: 'appliances', status: 'NEEDED', choice: '60 cm,Built-in', quantity: 1, note: '4 burners' },
    ]);
  });

  it('adds new custom rows without a key and removes saved ones', () => {
    const e = edits({
      added: [{ tempId: 'n1', section: 'appliances', label: ' Coffee machine ', draft: { ...EMPTY_DRAFT, status: 'NEEDED' } }],
      removed: ['custom.ab12cd34'],
    });
    expect(buildChanges(sheet(), e)).toEqual([
      { key: 'custom.ab12cd34', remove: true },
      { key: null, section: 'appliances', label: 'Coffee machine', status: 'NEEDED', choice: null, quantity: null, note: null },
    ]);
    const units = sectionRows(sheet().sections[0], e);
    expect(units.map((r) => r.id)).toEqual(['units.sink', 'units.hob']);
    const appliances = sectionRows(sheet().sections[1], e);
    expect(appliances.map((r) => [r.id, r.isNew])).toEqual([
      ['appliances.burner', false],
      ['n1', true],
    ]);
    // Taking the custom row out drops its unmarked count; the new one is needed.
    expect(liveCounts(sheet(), e)).toEqual({ needed: 2, notNeeded: 0, unmarked: 2 });
  });

  it('finds what would stop a save', () => {
    const problems = editProblems(
      sheet(),
      edits({
        drafts: { 'units.hob': { ...EMPTY_DRAFT, quantity: '-2' }, 'units.sink': { ...EMPTY_DRAFT, note: 'x'.repeat(1001) } },
        added: [{ tempId: 'n1', section: 'units', label: '  ', draft: EMPTY_DRAFT }],
      }),
    );
    expect(Object.keys(problems).sort()).toEqual(['n1', 'units.hob', 'units.sink']);
    expect(editProblems(sheet(), NO_EDITS)).toEqual({});
  });
});

describe('read-only view', () => {
  it('can show only the items something was entered for', () => {
    const units = sheet().sections[0];
    expect(shownItems(units, true).map((i) => i.key)).toEqual(['units.sink', 'custom.ab12cd34']);
    expect(shownItems(units, false)).toHaveLength(3);
  });
  it('knows a sheet nobody filled in', () => {
    expect(isSheetEmpty(sheet())).toBe(false);
    const blank = sheet();
    blank.sections = [{ key: 'units', title: 'Kitchen Units', items: [item({})] }];
    expect(isSheetEmpty(blank)).toBe(true);
  });
});
