/**
 * The finance import's columns as the screen and the CSV template name them. They must match
 * FinanceImportColumns on the server (the Excel template is built there).
 */

export const IMPORT_COLUMNS = [
  'Type',
  'Date',
  'Expense Name',
  'Vendor',
  'Amount',
  'Mode',
  'Cash in Hand Amount',
  'Cash in Hand %',
  'Quotation No',
  'Note',
  'Comment',
] as const;

const TYPE_LABEL: Record<string, string> = {
  PAYMENT: 'Payment received',
  EXPENSE: 'Expense',
  RELEASE: 'Vendor release',
};

export const importTypeLabel = (type?: string | null) => (type ? TYPE_LABEL[type] ?? type : '—');

/** The CSV template: the header row only, so nothing in it can be imported by mistake. */
export const importCsvTemplate = () => '﻿' + IMPORT_COLUMNS.map((c) => `"${c}"`).join(',') + '\r\n';
