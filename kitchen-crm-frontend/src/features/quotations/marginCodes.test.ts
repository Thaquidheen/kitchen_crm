import { describe, expect, it } from 'vitest';
import { CODE_FIELDS, codeChoices, codeField, codeLabel, defaultCodes, lineAmountWithMargin, pickCodes, sumWithMargin } from './marginCodeRules';

describe('margin code fields', () => {
  it('names the field of each category, offer and MRP', () => {
    expect(codeField('cabinets')).toBe('cabinetsMarginCode');
    expect(codeField('miscellaneous', 'mrp')).toBe('miscellaneousMrpMarginCode');
    expect(CODE_FIELDS).toHaveLength(10);
  });
});

describe('what staff read', () => {
  it('is the code, or Custom when no code stands for the margin', () => {
    expect(codeLabel('R')).toBe('R');
    expect(codeLabel(null)).toBe('Custom');
    expect(codeLabel('  ')).toBe('Custom');
  });
});

describe('the codes a quotation carries', () => {
  it('keeps the ten fields, missing ones as null, and nothing else', () => {
    const codes = pickCodes({ cabinetsMarginCode: 'R', doorsMrpMarginCode: 'K', extra: 1 } as never);
    expect(Object.keys(codes)).toHaveLength(10);
    expect(codes.cabinetsMarginCode).toBe('R');
    expect(codes.doorsMrpMarginCode).toBe('K');
    expect(codes.accessoriesMarginCode).toBeNull();
    expect(pickCodes(undefined).lightingMarginCode).toBeNull();
  });

  it('starts a new quotation from the default codes, MRP the same as the offer', () => {
    const codes = defaultCodes({ cabinets: 'R', accessories: 'K', lighting: null });
    expect(codes.cabinetsMarginCode).toBe('R');
    expect(codes.cabinetsMrpMarginCode).toBe('R');
    expect(codes.accessoriesMrpMarginCode).toBe('K');
    expect(codes.lightingMarginCode).toBeNull();
    expect(codes.miscellaneousMarginCode).toBeNull();
  });
});

describe('the list to choose from', () => {
  it('is the offered codes, with the current one kept when it is no longer offered', () => {
    expect(codeChoices(['K', 'R'], 'R')).toEqual(['K', 'R']);
    expect(codeChoices(['K', 'R'], 'r')).toEqual(['K', 'R']);
    expect(codeChoices(['K', 'R'], 'OLD')).toEqual(['OLD', 'K', 'R']);
    expect(codeChoices(['K'], null)).toEqual(['K']);
  });
});

describe("a line with margin, from the server's rate", () => {
  it('is rate x quantity, and for a door rate x face area x quantity', () => {
    expect(lineAmountWithMargin({ rateWithMargin: 28036.55, quantity: 1 })).toBe(28036.55);
    expect(lineAmountWithMargin({ rateWithMargin: 23945.31, quantity: 3 })).toBe(71835.93);
    expect(lineAmountWithMargin({ rateWithMargin: 1293.98, quantity: 1, calculatedSqft: 10.8253 }, true)).toBe(14007.72);
    expect(lineAmountWithMargin({ rateWithMargin: 1000, quantity: 1, widthMm: 600, heightMm: 720 }, true)).toBe(4650.01);
  });
  it('is unknown for a line the server has not priced yet', () => {
    expect(lineAmountWithMargin({ quantity: 2 })).toBeUndefined();
    expect(sumWithMargin([100, undefined])).toBeUndefined();
    expect(sumWithMargin([100, 50.5])).toBe(150.5);
  });
});
