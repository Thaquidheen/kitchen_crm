/**
 * Plain rules of the requirement sheet (no React), so they can be unit tested: marks, quick
 * choices, quantities, the live counts and what a save sends.
 */
import type {
  RequirementCounts,
  RequirementItem,
  RequirementItemChange,
  RequirementSection,
  RequirementSheet,
  RequirementStatus,
} from './requirementSheetAPI';

/** Limits the server checks too; checked here first so a save is not refused halfway. */
export const MAX_QUANTITY = 99999999;
export const MAX_NOTE = 1000;
export const MAX_LABEL = 255;

/** One item as it is being filled in. The quantity stays text so a half-typed "2." is kept. */
export interface ItemDraft {
  status: RequirementStatus | null;
  choice: string | null;
  quantity: string;
  note: string;
}

/** A custom row added on the screen and not saved yet. */
export interface NewRow {
  tempId: string;
  section: string;
  label: string;
  draft: ItemDraft;
}

/** Everything changed on the screen since the sheet was loaded. */
export interface SheetEdits {
  /** item key -> what it is now (only items that were touched). */
  drafts: Record<string, ItemDraft>;
  added: NewRow[];
  /** Keys of saved custom rows taken out. */
  removed: string[];
}

export const NO_EDITS: SheetEdits = { drafts: {}, added: [], removed: [] };

export const EMPTY_DRAFT: ItemDraft = { status: null, choice: null, quantity: '', note: '' };

export const draftOf = (item: Pick<RequirementItem, 'status' | 'choice' | 'quantity' | 'note'>): ItemDraft => ({
  status: item.status ?? null,
  choice: item.choice || null,
  quantity: item.quantity === null || item.quantity === undefined ? '' : String(item.quantity),
  note: item.note ?? '',
});

/** Clicking the mark that is already set takes it off again; the other one replaces it. */
export const nextStatus = (current: RequirementStatus | null, clicked: RequirementStatus): RequirementStatus | null =>
  current === clicked ? null : clicked;

/**
 * The quantity typed, as the number that is saved: null when left empty, undefined when it is
 * not a quantity at all (letters, below zero, too big). Kept to two decimals like the database.
 */
export const parseQuantity = (text: string): number | null | undefined => {
  const t = text.trim();
  if (t === '') {return null;}
  if (!/^\d*\.?\d*$/.test(t) || t === '.') {return undefined;}
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > MAX_QUANTITY) {return undefined;}
  return Math.round(n * 100) / 100;
};

export const quantityError = (text: string): string | null =>
  parseQuantity(text) === undefined ? `Quantity must be a number from 0 to ${MAX_QUANTITY}` : null;

export const noteError = (note: string): string | null =>
  note.trim().length > MAX_NOTE ? `Note can be at most ${MAX_NOTE} characters` : null;

export const labelError = (label: string): string | null => {
  const t = label.trim();
  if (!t) {return 'Name the item';}
  return t.length > MAX_LABEL ? `Item name can be at most ${MAX_LABEL} characters` : null;
};

/** The chosen quick options of an item, in the order they were saved. */
export const parseChoice = (choice: string | null | undefined): string[] =>
  (choice ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

/** Chosen options back to the saved text: known options only, in the order the item lists them. */
export const joinChoice = (options: string[][], selected: string[]): string | null => {
  const picked = new Set(selected);
  const ordered = options.flat().filter((o, i, all) => picked.has(o) && all.indexOf(o) === i);
  return ordered.length > 0 ? ordered.join(',') : null;
};

/**
 * Clicking a quick option: one choice per group (size, fitting...), so it replaces whatever else
 * was chosen in its group; clicking the chosen one again takes it off.
 */
export const toggleChoice = (options: string[][], choice: string | null, value: string): string | null => {
  const group = options.find((g) => g.includes(value));
  if (!group) {return joinChoice(options, parseChoice(choice));}
  const current = parseChoice(choice);
  const next = current.includes(value)
    ? current.filter((c) => c !== value)
    : [...current.filter((c) => !group.includes(c)), value];
  return joinChoice(options, next);
};

/** The chosen options as people read them. */
export const choiceText = (choice: string | null | undefined): string => parseChoice(choice).join(', ');

const normQuantity = (text: string): string => {
  const q = parseQuantity(text);
  return q === undefined ? `bad:${text.trim()}` : q === null ? '' : String(q);
};

export const sameDraft = (a: ItemDraft, b: ItemDraft): boolean =>
  a.status === b.status &&
  (a.choice || null) === (b.choice || null) &&
  normQuantity(a.quantity) === normQuantity(b.quantity) &&
  a.note.trim() === b.note.trim();

export const isBlankDraft = (d: ItemDraft): boolean => sameDraft(d, EMPTY_DRAFT);

/** Something was entered for the item: a mark, a choice, a quantity or a note. */
export const hasEntry = (item: Pick<RequirementItem, 'status' | 'choice' | 'quantity' | 'note'>): boolean =>
  !isBlankDraft(draftOf(item));

export const countStatuses = (statuses: Array<RequirementStatus | null>): RequirementCounts => ({
  needed: statuses.filter((s) => s === 'NEEDED').length,
  notNeeded: statuses.filter((s) => s === 'NOT_NEEDED').length,
  unmarked: statuses.filter((s) => s !== 'NEEDED' && s !== 'NOT_NEEDED').length,
});

/** One row as the editor shows it: a saved item with its current answers, or a new custom row. */
export interface SheetRow {
  /** The item key, or the temporary id of a row that is not saved yet. */
  id: string;
  label: string;
  custom: boolean;
  isNew: boolean;
  options: string[][];
  draft: ItemDraft;
  changed: boolean;
  updatedByName?: string | null;
  updatedAt?: string | null;
}

export const sectionRows = (section: RequirementSection, edits: SheetEdits): SheetRow[] => [
  ...section.items
    .filter((item) => !(item.custom && edits.removed.includes(item.key)))
    .map((item) => {
      const saved = draftOf(item);
      const draft = edits.drafts[item.key] ?? saved;
      return {
        id: item.key,
        label: item.label,
        custom: item.custom,
        isNew: false,
        options: item.options ?? [],
        draft,
        changed: !sameDraft(draft, saved),
        updatedByName: item.updatedByName,
        updatedAt: item.updatedAt,
      };
    }),
  ...edits.added
    .filter((row) => row.section === section.key)
    .map((row) => ({
      id: row.tempId,
      label: row.label,
      custom: true,
      isNew: true,
      options: [],
      draft: row.draft,
      changed: true,
    })),
];

/** The counts as they will be once the changes on the screen are saved. */
export const liveCounts = (sheet: RequirementSheet, edits: SheetEdits): RequirementCounts =>
  countStatuses(sheet.sections.flatMap((s) => sectionRows(s, edits).map((r) => r.draft.status)));

/** What a save sends: only the items that changed, each with all its answers. */
export const buildChanges = (sheet: RequirementSheet, edits: SheetEdits): RequirementItemChange[] => {
  const out: RequirementItemChange[] = [];
  const answers = (d: ItemDraft) => ({
    status: d.status,
    choice: d.choice || null,
    quantity: parseQuantity(d.quantity) ?? null,
    note: d.note.trim() || null,
  });
  for (const section of sheet.sections) {
    for (const item of section.items) {
      if (item.custom && edits.removed.includes(item.key)) {
        out.push({ key: item.key, remove: true });
        continue;
      }
      const draft = edits.drafts[item.key];
      if (!draft || sameDraft(draft, draftOf(item))) {continue;}
      // A custom row's name goes with it, so a server that rewrites the whole row keeps it.
      out.push({ key: item.key, section: section.key, ...(item.custom ? { label: item.label } : {}), ...answers(draft) });
    }
  }
  for (const row of edits.added) {
    out.push({ key: null, section: row.section, label: row.label.trim(), ...answers(row.draft) });
  }
  return out;
};

/** Why the changes cannot be saved yet, per row id; empty when they can. */
export const editProblems = (sheet: RequirementSheet, edits: SheetEdits): Record<string, string> => {
  const problems: Record<string, string> = {};
  for (const section of sheet.sections) {
    for (const row of sectionRows(section, edits)) {
      if (!row.changed) {continue;}
      const problem =
        (row.isNew ? labelError(row.label) : null) ?? quantityError(row.draft.quantity) ?? noteError(row.draft.note);
      if (problem) {problems[row.id] = problem;}
    }
  }
  return problems;
};

/** Items worth showing when only what was filled in is wanted (read-only view, print). */
export const shownItems = (section: RequirementSection, onlyMarked: boolean): RequirementItem[] =>
  onlyMarked ? section.items.filter(hasEntry) : section.items;

/** Nothing has been entered for this customer yet. */
export const isSheetEmpty = (sheet: RequirementSheet): boolean =>
  sheet.sections.every((s) => s.items.every((item) => !hasEntry(item)));
