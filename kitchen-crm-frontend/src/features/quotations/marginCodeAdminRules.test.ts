import { describe, expect, it } from 'vitest';
import {
  codeForPercentage,
  formatPercentage,
  marginCodeProblems,
  refusalMessage,
  samePercentage,
  sortMarginCodes,
} from './marginCodeAdminRules';
import type { MarginCode } from './marginCodesAPI';

const codes: MarginCode[] = [
  { id: 1, code: 'R', percentage: 45, active: true },
  { id: 2, code: 'K', percentage: 15, active: true },
  { id: 3, code: 'Z', percentage: 0, active: false, note: 'At cost' },
  { id: 4, code: 'H2', percentage: 12.5, active: true },
];

const draft = (code: string, percentage: string) => ({ code, percentage, note: '' });

describe('the code that stands for a percentage', () => {
  it('is found by value, not by how the number is written', () => {
    expect(codeForPercentage(codes, 45)?.code).toBe('R');
    expect(codeForPercentage(codes, 45.0)?.code).toBe('R');
    expect(codeForPercentage(codes, 12.5)?.code).toBe('H2');
    expect(codeForPercentage(codes, 12.499999999)?.code).toBe('H2');
  });
  it('includes a switched-off code: quotations using it still show it', () => {
    expect(codeForPercentage(codes, 0)?.code).toBe('Z');
  });
  it('is none when no code stands for it, or nothing is known', () => {
    expect(codeForPercentage(codes, 20)).toBeUndefined();
    expect(codeForPercentage(codes, 45.01)).toBeUndefined();
    expect(codeForPercentage(undefined, 45)).toBeUndefined();
    expect(codeForPercentage(codes, null)).toBeUndefined();
    expect(codeForPercentage(codes, undefined)).toBeUndefined();
    expect(codeForPercentage(codes, NaN)).toBeUndefined();
  });
});

describe('percentages', () => {
  it('match to two decimals, rounded half up as the server stores them', () => {
    expect(samePercentage(0.1 + 0.2, 0.3)).toBe(true);
    expect(samePercentage(28.5, 28.499999999999996)).toBe(true);
    expect(samePercentage(12.345, 12.35)).toBe(true);
    expect(samePercentage(12.34, 12.35)).toBe(false);
  });
  it('are written without trailing zeros', () => {
    expect(formatPercentage(45)).toBe('45');
    expect(formatPercentage(12.5)).toBe('12.5');
    expect(formatPercentage(12.25)).toBe('12.25');
    expect(formatPercentage(0)).toBe('0');
  });
});

describe('the list', () => {
  it('is lowest percentage first', () => {
    expect(sortMarginCodes(codes).map((c) => c.code)).toEqual(['Z', 'H2', 'K', 'R']);
  });
  it('does not change the list it was given', () => {
    const before = codes.map((c) => c.code);
    sortMarginCodes(codes);
    expect(codes.map((c) => c.code)).toEqual(before);
  });
});

describe('a new code', () => {
  it('can be sent when the code and percentage are free', () => {
    expect(marginCodeProblems(draft('M', '30'), codes)).toEqual({});
    expect(marginCodeProblems(draft(' k-2 ', '500'), codes)).toEqual({});
    expect(marginCodeProblems(draft('ABCDEFGHIJKL', '0.75'), codes)).toEqual({});
  });
  it('is 1 to 12 letters, digits or dashes', () => {
    expect(marginCodeProblems(draft('', '30'), codes).code).toBe('Enter a code');
    expect(marginCodeProblems(draft('   ', '30'), codes).code).toBe('Enter a code');
    for (const bad of ['R 1', 'R_1', 'R%', 'ÄB', 'ABCDEFGHIJKLM']) {
      expect(marginCodeProblems(draft(bad, '30'), codes).code).toMatch(/^A code is 1 to 12 letters/);
    }
  });
  it('may not repeat a code, whatever its case', () => {
    expect(marginCodeProblems(draft('r', '30'), codes).code).toBe('The code R already exists');
    expect(marginCodeProblems(draft('h2', '30'), codes).code).toBe('The code H2 already exists');
  });
  it('needs a percentage from 0 to 500 with at most 2 decimals', () => {
    expect(marginCodeProblems(draft('M', ''), codes).percentage).toBe('Enter a percentage');
    for (const bad of ['-5', 'abc', '1e2', '12.345', '45%']) {
      expect(marginCodeProblems(draft('M', bad), codes).percentage).toBe(
        'Enter a number from 0 to 500, with at most 2 decimals'
      );
    }
    expect(marginCodeProblems(draft('M', '500.01'), codes).percentage).toBe('The percentage must be between 0 and 500');
    expect(marginCodeProblems(draft('M', '.5'), codes).percentage).toBeUndefined();
  });
  it('may not give a percentage a second code', () => {
    expect(marginCodeProblems(draft('M', '45.00'), codes).percentage).toBe('45% already has the code R');
    expect(marginCodeProblems(draft('M', '12.5'), codes).percentage).toBe('12.5% already has the code H2');
    expect(marginCodeProblems(draft('M', '0'), codes).percentage).toBe('0% already has the code Z');
  });
});

describe('changing a code', () => {
  it('may keep its own code and percentage', () => {
    expect(marginCodeProblems(draft('R', '45'), codes, 1)).toEqual({});
    expect(marginCodeProblems(draft('r', '46'), codes, 1)).toEqual({});
  });
  it('may not take another code or its percentage', () => {
    expect(marginCodeProblems(draft('K', '45'), codes, 1).code).toBe('The code K already exists');
    expect(marginCodeProblems(draft('R', '15'), codes, 1).percentage).toBe('15% already has the code K');
  });
});

describe('a refusal', () => {
  it("shows the server's reason, from a thrown error or an error response", () => {
    expect(refusalMessage(new Error('The code R already exists'), 'Failed')).toBe('The code R already exists');
    expect(refusalMessage({ status: 400, data: { success: false, message: '45% already has the code R' } }, 'Failed')).toBe(
      '45% already has the code R'
    );
  });
  it('falls back when there is no reason to show', () => {
    expect(refusalMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }, 'Failed')).toBe('Failed');
    expect(refusalMessage({ status: 502, data: '<html>' }, 'Failed')).toBe('Failed');
    expect(refusalMessage(new Error(' '), 'Failed')).toBe('Failed');
    expect(refusalMessage(undefined, 'Failed')).toBe('Failed');
  });
});
