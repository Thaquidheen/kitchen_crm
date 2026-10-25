import { describe, expect, it } from 'vitest';
import { changedCodeCategories, formKey, otherExpensesFromServer, pricingSnapshot, taxInside, withPricedFigures } from './serverFigureRules';

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

describe('the figures the screen keeps in the form', () => {
  const form = {
    notes: 'a',
    kitchens: [{
      kitchenName: 'Main',
      totalAmount: 1000,
      cabinetsFinalTotal: 800,
      cabinets: [{ cabinetTypeId: 5, quantity: 2, rateWithMargin: 400 }],
    }],
  };
  it('are not what was entered: they change neither the price key nor "unsaved changes"', () => {
    const repriced = {
      ...form,
      kitchens: [{ ...form.kitchens[0], totalAmount: 2000, cabinetsFinalTotal: 1600, cabinets: [{ cabinetTypeId: 5, quantity: 2, rateWithMargin: 800 }] }],
    };
    expect(pricingSnapshot(repriced)).toBe(pricingSnapshot(form));
    expect(formKey(repriced)).toBe(formKey(form));
    expect(formKey({ ...form, notes: 'b' })).not.toBe(formKey(form));
  });
});

describe("the server's preview of the form", () => {
  const priced = {
    kitchens: [{
      totalAmount: 5000, taxAmount: 700, cabinetsFinalTotal: 4000, accessoriesFinalTotal: 0, doorsFinalTotal: 0, lightingFinalTotal: 1000,
      cabinets: [{ cabinetTypeId: 5, quantity: 2, rateWithMargin: 1500, amountWithMargin: 3000 }],
      lighting: [{ itemId: -101, quantity: 1, rateWithMargin: 800, amountWithMargin: 800 }],
      accessories: [], doors: [],
    }],
  };
  const form = {
    kitchens: [{
      kitchenName: 'Main',
      cabinets: [{ cabinetTypeId: 5, quantity: 2 }],
      lighting: [{ id: -101, quantity: 1, rateWithMargin: 700 }],
      accessories: [], doors: [],
    }],
  };
  it('puts each kitchen\'s totals and each line\'s amount with margin in place', () => {
    const out = withPricedFigures(form, priced) as typeof form & { kitchens: Array<Record<string, unknown>> };
    const k = out.kitchens[0] as Record<string, any>;
    expect(k.totalAmount).toBe(5000);
    expect(k.taxAmount).toBe(700);
    expect(k.cabinetsFinalTotal).toBe(4000);
    expect(k.cabinets[0].rateWithMargin).toBe(1500);
    expect(k.lighting[0].rateWithMargin).toBe(800);
    expect(k.kitchenName).toBe('Main');
  });
  it('gives a list no line figures when it does not match line for line', () => {
    const changed = { kitchens: [{ ...form.kitchens[0], cabinets: [{ cabinetTypeId: 5, quantity: 3 }] }] };
    const k = (withPricedFigures(changed, priced).kitchens as Array<Record<string, any>>)[0];
    expect(k.cabinets[0].rateWithMargin).toBeUndefined();
    expect(k.lighting[0].rateWithMargin).toBe(800);
  });
  it('fills a quotation without kitchens the same way', () => {
    const out = withPricedFigures(
      { kitchens: [], accessories: [{ id: 9, quantity: 4 }] },
      { accessories: [{ accessoryId: 9, quantity: 4, rateWithMargin: 50, amountWithMargin: 200 }] },
    ) as Record<string, any>;
    expect(out.accessories[0].amountWithMargin).toBe(200);
  });
});
