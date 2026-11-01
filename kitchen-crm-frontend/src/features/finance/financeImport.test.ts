import { describe, expect, it } from 'vitest';
import { IMPORT_COLUMNS, importCsvTemplate, importTypeLabel } from './financeImport';

describe('financeImport', () => {
  it('the CSV template is just the header row, with a BOM so Excel reads ₹ and names right', () => {
    const csv = importCsvTemplate();
    expect(csv.startsWith('\uFEFF"Type","Date","Expense Name","Vendor","Amount","Mode"')).toBe(true);
    expect(csv.trim().split('\r\n')).toHaveLength(1);
    expect(IMPORT_COLUMNS).toHaveLength(11);
  });

  it('names the row types as the template does', () => {
    expect(importTypeLabel('PAYMENT')).toBe('Payment received');
    expect(importTypeLabel('RELEASE')).toBe('Vendor release');
    expect(importTypeLabel(null)).toBe('—');
  });
});
