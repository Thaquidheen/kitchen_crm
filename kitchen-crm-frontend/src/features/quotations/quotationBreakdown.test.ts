import { describe, expect, it } from 'vitest';
import {
  breakdownLine,
  categoryBreakdown,
  commonTransport,
  doorFaceSqft,
  expenseBreakdown,
  kitchenCategories,
  money,
  pctText,
  quotationSummary,
  shareOf,
} from './quotationBreakdown';

const close = (a: number | undefined, b: number) => expect(a).toBeCloseTo(b, 2);

describe('a line before margin', () => {
  it('cabinet: rate × qty, never the stored total (that one multiplies by the area again)', () => {
    const l = breakdownLine('cabinets', { description: 'Corner Base Cabinet', quantity: 3, unitPrice: 16514.01, calculatedSqft: 31.74, totalPrice: 1572602.75 }, 45);
    expect(l.name).toBe('Corner Base Cabinet');
    close(l.base, 49542.03);
    close(l.withMargin, 49542.03 * 1.45);
    expect(l.sqft).toBeUndefined();
  });

  it('door: rate per sq ft × face area (width × height) × qty', () => {
    const l = breakdownLine('doors', { description: 'Shutter', quantity: 2, unitPrice: 892.4, widthMm: 600, heightMm: 720 }, 45);
    const sqft = (600 * 720) / 92903;
    close(l.sqft, sqft);
    close(l.base, 892.4 * sqft * 2);
  });

  it('a door without a size counts one sq ft, as the builder does', () => {
    expect(doorFaceSqft(undefined, 720)).toBe(1);
  });

  it('a door uses the face area the server priced it with when it is sent', () => {
    const l = breakdownLine('doors', { quantity: 1, unitPrice: 900, widthMm: 600, heightMm: 720, calculatedSqft: 0 });
    expect(l.sqft).toBe(0);
    expect(l.base).toBe(0);
  });

  it('accessory and lighting: rate × qty', () => {
    close(breakdownLine('accessories', { accessoryName: 'Tandem', quantity: 4, unitPrice: 2500 }).base, 10000);
    close(breakdownLine('lighting', { itemName: 'Profile', quantity: 2, unitPrice: 1200 }).base, 2400);
  });

  it("says what a line is made of, for everyone: material, size, inner panel; a brand", () => {
    const cab = breakdownLine('cabinets', {
      description: 'Storage Base Cabinet', quantity: 1, materialName: 'SS 304', widthMm: 1130, heightMm: 600, depthMm: 890,
      innerPanelTypeName: 'Middle Shelf', innerPanelQuantity: 1,
    });
    expect(cab.detail).toBe('SS 304 · 1130×600×890 mm · Middle Shelf ×1');
    expect(cab.rate).toBeUndefined();
    const named = breakdownLine('cabinets', { description: 'Corner Base Cabinet (900×600×890mm)', materialName: 'SS 304', widthMm: 900, heightMm: 600, depthMm: 890 });
    expect(named.detail).toBe('SS 304');
    expect(breakdownLine('accessories', { accessoryName: 'Tandem', brandName: 'BLUM', quantity: 2, unitPrice: 100 }).detail).toBe('BLUM');
    expect(breakdownLine('lighting', { itemName: 'Profile', quantity: 2 }).detail).toBeUndefined();
  });

  it('a rate this person is not sent stays unknown, never 0', () => {
    const l = breakdownLine('cabinets', { description: 'Cabinet', quantity: 2, totalPrice: 999 }, 45);
    expect(l).toEqual({ name: 'Cabinet', qty: 2 });
  });
});

describe('a category', () => {
  const items = [
    { description: 'A', quantity: 1, unitPrice: 1000 },
    { description: 'B', quantity: 2, unitPrice: 500 },
  ];

  it('takes the totals saved with the kitchen when they are there', () => {
    const c = categoryBreakdown('cabinets', items, { margin: 45, tax: 18 }, { base: 2000.5, margin: 900, tax: 522, final: 3422.5 });
    expect([c.base, c.margin, c.tax, c.final]).toEqual([2000.5, 900, 522, 3422.5]);
    close(c.afterMargin, 2900.5);
    expect(c.marginPct).toBe(45);
  });

  it('works them out from the lines when they are not', () => {
    const c = categoryBreakdown('cabinets', items, { margin: '45.00', tax: '18.00' });
    close(c.base, 2000);
    close(c.margin, 900);
    close(c.tax, 2900 * 0.18);
    close(c.final, 2900 * 1.18);
  });

  it('without rates and margins, only what the customer pays is known', () => {
    const c = categoryBreakdown('doors', [{ description: 'D', quantity: 1 }], { tax: 18 }, { tax: 180, final: 1180 });
    expect(c.base).toBeUndefined();
    expect(c.margin).toBeUndefined();
    expect(c.final).toBe(1180);
  });
});

describe('other expenses', () => {
  it('carry the miscellaneous margin and GST', () => {
    const e = expenseBreakdown(
      [{ name: 'Transportation', amount: 70000 }, { name: 'Installation', amount: '60000' }, { name: 'Empty', amount: 0 }],
      { margin: 0, tax: 18 },
    );
    expect(e.rows.map((r) => r.name)).toEqual(['Transportation', 'Installation']);
    expect(e.base).toBe(130000);
    close(e.final, 153400);
  });

  it('without the margin, GST and the total are unknown rather than too small', () => {
    const e = expenseBreakdown([{ name: 'Transportation', amount: 70000 }], { tax: 18 });
    expect(e.base).toBe(70000);
    expect(e.tax).toBeUndefined();
    expect(e.final).toBeUndefined();
  });

  it('a quotation with several kitchens shows its shared transportation once', () => {
    const q = { kitchens: [{}, {}], transportationPrice: 70000, miscellaneousMarginPercentage: 0, miscellaneousTaxPercentage: 18 };
    close(commonTransport(q)?.final, 82600);
    expect(commonTransport({ ...q, kitchens: [{}] })).toBeNull();
    expect(commonTransport({ ...q, transportationPrice: 0 })).toBeNull();
  });
});

describe('a kitchen as stored (the quotation in the report)', () => {
  it('rebuilds the kitchen total from its parts', () => {
    const quotation = {
      cabinetsMarginPercentage: 45, cabinetsTaxPercentage: 18,
      doorsMarginPercentage: 45, doorsTaxPercentage: 18,
      accessoriesMarginPercentage: 15, accessoriesTaxPercentage: 18,
      lightingMarginPercentage: 0, lightingTaxPercentage: 18,
    };
    const kitchen = {
      cabinets: [{ description: 'Cabinet', quantity: 1, unitPrice: 243359.13 }],
      doors: [{ description: 'Door', quantity: 1, unitPrice: 145932.82 }],
      accessories: [{ accessoryName: 'Acc', quantity: 1, unitPrice: 74784.57 }],
      lighting: [],
      cabinetsBaseTotal: 243359.13, cabinetsMarginAmount: 109511.61, cabinetsTaxAmount: 63516.73, cabinetsFinalTotal: 416387.48,
      doorsBaseTotal: 145932.82, doorsMarginAmount: 65669.77, doorsTaxAmount: 38088.47, doorsFinalTotal: 249691.06,
      accessoriesBaseTotal: 74784.57, accessoriesMarginAmount: 11217.69, accessoriesTaxAmount: 15480.41, accessoriesFinalTotal: 101482.66,
    };
    const cats = kitchenCategories(kitchen, quotation);
    expect(cats.map((c) => c.title)).toEqual(['Cabinets', 'Doors', 'Accessories']);
    const exp = expenseBreakdown([{ name: 'Transportation', amount: 70000 }, { name: 'Installation', amount: 60000 }, { name: 'Light', amount: 35000 }, { name: 'Exposed Handle', amount: 20000 }], { margin: 0, tax: 18 });
    const total = cats.reduce((s, c) => s + (c.final ?? 0), 0) + (exp.final ?? 0);
    close(total, 985861.2);
  });
});

describe('formatting', () => {
  it('shows rupees with paise and percentages without trailing zeros', () => {
    expect(money(1225456.4)).toBe('₹12,25,456.40');
    expect(money(undefined)).toBe('—');
    expect(pctText(45)).toBe('45%');
    expect(pctText(12.5)).toBe('12.5%');
    expect(pctText(undefined)).toBe('—');
  });
});

describe('staff shown margin codes', () => {
  it('get each line with margin from the server, and the code instead of the percentage', () => {
    const c = categoryBreakdown(
      'cabinets',
      [{ description: 'Storage Base Cabinet', quantity: 1, rateWithMargin: 28036.55, amountWithMargin: 28036.55 }],
      { tax: 18, code: 'R' },
      { tax: 63516.73, final: 416387.48 },
    );
    expect(c.lines[0]).toMatchObject({ name: 'Storage Base Cabinet', withMargin: 28036.55, rateWithMargin: 28036.55 });
    expect(c.lines[0].base).toBeUndefined();
    expect(c.marginCode).toBe('R');
    expect(c.marginPct).toBeUndefined();
    close(c.afterMargin, 352870.75);
  });
});

describe('the quotation summary', () => {
  // Two kitchens; margins are the quotation's, so the same % in both.
  const k1 = {
    name: 'Main kitchen',
    cats: [
      categoryBreakdown('cabinets', [{ description: 'A', quantity: 1, unitPrice: 1000 }], { margin: 40, tax: 18 }),
      categoryBreakdown('accessories', [{ description: 'B', quantity: 2, unitPrice: 100 }], { margin: 15, tax: 18 }),
    ],
    exp: expenseBreakdown([{ name: 'Installation', amount: 500 }], { margin: 10, tax: 18 }),
  };
  const k2 = {
    name: 'Work kitchen',
    cats: [categoryBreakdown('cabinets', [{ description: 'C', quantity: 1, unitPrice: 2000 }], { margin: 40, tax: 18 })],
    exp: expenseBreakdown([], { margin: 10, tax: 18 }),
  };
  const transport = expenseBreakdown([{ name: 'Transportation (all kitchens)', amount: 1000 }], { margin: 10, tax: 18 });

  it('has a row per kitchen and the shared transportation', () => {
    const s = quotationSummary([k1, k2], transport);
    expect(s.byKitchen.map((r) => r.name)).toEqual(['Main kitchen', 'Work kitchen', 'Transportation (all kitchens)']);
    close(s.byKitchen[0].base, 1700);
    close(s.byKitchen[0].margin, 400 + 30 + 50);
    close(s.byKitchen[1].final, 2000 * 1.4 * 1.18);
  });

  it('adds each category up over the kitchens, with its margin %', () => {
    const s = quotationSummary([k1, k2], transport);
    expect(s.byCategory.map((r) => r.name)).toEqual(['Cabinets', 'Accessories', 'Other expenses']);
    close(s.byCategory[0].base, 3000);
    close(s.byCategory[0].margin, 1200);
    expect(s.byCategory[0].pct).toBe(40);
    close(s.byCategory[2].base, 1500);
    expect(s.byCategory[2].pct).toBe(10);
  });

  it('totals everything; the stored quotation total wins', () => {
    const s = quotationSummary([k1, k2], transport, 99999);
    close(s.total.base, 4700);
    close(s.total.margin, 1200 + 30 + 150);
    expect(s.total.final).toBe(99999);
    close(shareOf(s.total.margin, s.total.base), (1380 / 4700) * 100);
    close(shareOf(40, 140), 28.5714);
  });

  it('has no kitchen rows for a single kitchen', () => {
    expect(quotationSummary([k1], null).byKitchen).toEqual([]);
  });

  it('leaves unknown what this person is not sent, never a smaller figure', () => {
    const staff = {
      name: 'Main kitchen',
      cats: [categoryBreakdown('cabinets', [{ description: 'A', quantity: 1 }], { tax: 18 }, { tax: 180, final: 1180 })],
      exp: expenseBreakdown([], { tax: 18 }),
    };
    const s = quotationSummary([staff], null, 1180);
    expect(s.total.base).toBeUndefined();
    expect(s.total.margin).toBeUndefined();
    close(s.total.after, 1000);
    expect(s.total.final).toBe(1180);
  });
});
