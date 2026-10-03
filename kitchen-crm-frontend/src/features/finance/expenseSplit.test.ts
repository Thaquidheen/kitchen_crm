import { describe, expect, it } from 'vitest';
import { amountOf, complementOf, parseField, pctOf, resolveSplit, round2 } from './expenseSplit';

describe('expenseSplit', () => {
  it('parses typed fields, rejecting blanks, text and negatives', () => {
    expect(parseField('73450')).toBe(73450);
    expect(parseField('0')).toBe(0);
    expect(parseField('  ')).toBeNull();
    expect(parseField('abc')).toBeNull();
    expect(parseField('-5')).toBeNull();
  });

  it('completes the other side of a pair', () => {
    expect(complementOf(200000, '73450')).toBe('126550');
    expect(complementOf(100, '36.1')).toBe('63.9');
    expect(complementOf(200000, '200000')).toBe('0');
    expect(complementOf(200000, '')).toBeNull();
    expect(complementOf(200000, '200001')).toBeNull();
  });

  it('converts between rupees and percent with 2-decimal rounding', () => {
    expect(pctOf(73450, 200000)).toBe(36.73);
    expect(pctOf(50000, 0)).toBe(0);
    expect(amountOf(36.1, 200000)).toBe(72200);
    expect(round2(1.005)).toBe(1.01);
  });

  it('keeps the exact rupees when the split is typed as amounts', () => {
    const r = resolveSplit('AMOUNT', 200000, '73450', '126550');
    expect(r.error).toBeUndefined();
    expect(r.cashInHandAmount).toBe(73450);
    expect(r.cashInHandPct).toBe(36.73);
    expect(r.cashInAccountPct).toBe(63.27);
  });

  it('treats an empty side as the rest of the amount', () => {
    expect(resolveSplit('AMOUNT', 200000, '', '50000').cashInHandAmount).toBe(150000);
    expect(resolveSplit('AMOUNT', 200000, '200000', '').cashInAccountPct).toBe(0);
  });

  it('refuses amounts that do not add up to the total', () => {
    expect(resolveSplit('AMOUNT', 200000, '', '').error).toMatch(/Enter how much/);
    expect(resolveSplit('AMOUNT', 200000, '100000', '50000').error).toMatch(/must equal the amount/);
    expect(resolveSplit('AMOUNT', 200000, '250000', '').error).toMatch(/must equal the amount/);
  });

  it('needs no split while the expense has no amount yet', () => {
    expect(resolveSplit('AMOUNT', 0, '', '')).toEqual({ cashInHandPct: 100, cashInAccountPct: 0, cashInHandAmount: null });
    expect(resolveSplit('AMOUNT', 0, '0', '0').error).toBeUndefined();
    expect(resolveSplit('AMOUNT', 0, '5000', '').error).toMatch(/Enter the amount/);
    expect(resolveSplit('PCT', 0, '100', '0')).toMatchObject({ cashInHandPct: 100, cashInHandAmount: null });
  });

  it('sends no exact amount when the split is typed as percentages', () => {
    const r = resolveSplit('PCT', 200000, '36.1', '63.9');
    expect(r).toMatchObject({ cashInHandPct: 36.1, cashInAccountPct: 63.9, cashInHandAmount: null });
    expect(r.error).toBeUndefined();
    expect(resolveSplit('PCT', 200000, '60', '30').error).toMatch(/add up to 100/);
  });
});
