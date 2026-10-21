import { describe, expect, it } from 'vitest';
import { changedCodeCategories, otherExpensesFromServer, pricingSnapshot, taxInside } from './serverFigureRules';

describe('the other expenses, as the server worked them out', () => {
  it('is the total less the category totals', () => {
    // Transport + installation 50,000, misc margin 10%, GST 18%: 64,900 on top of 100,000 of products.
    expect(otherExpensesFromServer(164900, [40000, 30000, 20000, 10000])).toBe(64900);
    expect(otherExpensesFromServer(100000.1, [50000.05, 50000.05])).toBe(0);
  });
  it('is unknown when the total or a category total is', () => {
    expect(otherExpensesFromServer(null, [1, 2])).toBeNull();
    expect(otherExpensesFromServer(100, [1, undefined])).toBeNull();
  });
  it('carries its GST inside', () => {
    expect(taxInside(64900, 18)).toBeCloseTo(9900, 6);
    expect(taxInside(500, 0)).toBe(0);
  });
});

describe('what changes the price of a quotation being edited', () => {
  const form = {
    projectName: 'Kitchen',
    notes: 'a',
    accessoriesMarginCode: 'R',
    otherExpenses: [{ name: 'Transportation', amount: 100 }],
    kitchens: [{ kitchenName: 'Main', scopeDetails: [1], planImages: [2], accessories: [{ id: 1, quantity: 1 }] }],
  };
  it('is not the wording, the kitchen names or the plans', () => {
    const reworded = {
      ...form,
      projectName: 'Kitchen 2',
      notes: 'b',
      kitchens: [{ ...form.kitchens[0], kitchenName: 'Upper', scopeDetails: [], planImages: [] }],
    };
    expect(pricingSnapshot(reworded)).toBe(pricingSnapshot(form));
  });
  it('is the products, the expenses and the codes', () => {
    expect(pricingSnapshot({ ...form, accessoriesMarginCode: 'K' })).not.toBe(pricingSnapshot(form));
    expect(pricingSnapshot({ ...form, otherExpenses: [{ name: 'Transportation', amount: 200 }] })).not.toBe(pricingSnapshot(form));
    const more = { ...form, kitchens: [{ ...form.kitchens[0], accessories: [{ id: 1, quantity: 2 }] }] };
    expect(pricingSnapshot(more)).not.toBe(pricingSnapshot(form));
  });
});

describe('lines priced with a code that has since been changed', () => {
  it('are those of the categories whose offer code changed (any case)', () => {
    const opened = { cabinetsMarginCode: 'R', lightingMarginCode: 'K', doorsMrpMarginCode: 'K' };
    expect(changedCodeCategories(opened, { cabinetsMarginCode: 'r', lightingMarginCode: 'T', doorsMrpMarginCode: 'Z' })).toEqual(['lighting']);
    expect(changedCodeCategories(opened, { ...opened, accessoriesMarginCode: 'Z' })).toEqual(['accessories']);
  });
  it('are none for a new quotation', () => {
    expect(changedCodeCategories(null, { cabinetsMarginCode: 'R' })).toEqual([]);
  });
});
