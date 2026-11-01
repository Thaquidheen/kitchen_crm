/** Income & Expenses module — mirrors the backend finance DTOs. */

export type PaymentMode = 'CASH_IN_HAND' | 'CASH_IN_ACCOUNT';
export type ReceiptKind = 'RECEIPT' | 'QUOTE';

export interface FinanceReceipt {
  id: number;
  kind: ReceiptKind;
  fileUrl: string;
  fileName: string;
  uploadedAt?: string;
}

export interface FinancePayment {
  id: number;
  amount: number;
  mode: PaymentMode;
  paymentDate: string;
  note?: string;
  comment?: string;
  createdBy?: string;
  receipts: FinanceReceipt[];
}

export interface FinanceExpense {
  id: number;
  title: string;
  amount: number;
  cashInHandPct: number;
  cashInAccountPct: number;
  cashInHandAmount: number;
  cashInAccountAmount: number;
  /** True when the split was entered as exact rupees — the two percentages are then derived. */
  splitByAmount?: boolean;
  vendorId?: number;
  vendorName?: string;
  quotationId?: number;
  quotationNumber?: string;
  quotationTotal?: number;
  releasedAmount: number;
  pendingAmount: number;
  expenseDate?: string;
  note?: string;
  receipts: FinanceReceipt[];
}

export interface FinanceRelease {
  id: number;
  vendorId: number;
  vendorName: string;
  expenseId?: number;
  expenseTitle?: string;
  amount: number;
  mode: PaymentMode;
  releaseDate: string;
  note?: string;
  receipts: FinanceReceipt[];
}

export interface VendorTotal {
  vendorId: number;
  vendorName: string;
  /** Sum of expense lines assigned to this vendor (this customer only). */
  totalExpensed: number;
  expensedCashInHand: number;
  expensedCashInAccount: number;
  totalReleased: number;
  releasedCashInHand: number;
  releasedCashInAccount: number;
  /** expensed − released; negative = over-released. */
  balance: number;
  /** Per-bucket balance, signed like `balance` — cash and bank can disagree. */
  balanceCashInHand: number;
  balanceCashInAccount: number;
  expenseCount: number;
  releaseCount: number;
  /**
   * Set by the server when one side was paid beyond its share while the other is still owed:
   * the side paid from, the amount counted against the other share (not extra), and anything
   * beyond the vendor's total. Absent when there is no shift. See vendorBuckets.
   */
  shiftFrom?: PaymentMode | null;
  shiftAmount?: number | null;
  shiftBeyondTotal?: number | null;
}

export interface FinanceSummary {
  financeId: number;
  customerId: number;
  customerName: string;
  customerContact?: string;
  customerPlace?: string;
  customerAddress?: string;
  totalAmount: number;
  committedCashInHand: number;
  committedCashInAccount: number;
  notes?: string;
  receivedTotal: number;
  receivedCashInHand: number;
  receivedCashInAccount: number;
  totalBalance: number;
  cashInHandBalance: number;
  cashInAccountBalance: number;
  overCollected?: boolean;
  /** committed C/H + C/A ≠ totalAmount, so the margin split cannot re-sum to totalMargin. */
  committedSplitMismatch?: boolean;
  expenseTotal: number;
  expenseCashInHand: number;
  expenseCashInAccount: number;
  releasedTotal: number;
  releasedCashInHand: number;
  releasedCashInAccount: number;
  /**
   * Worked out per vendor then summed, NOT expenseTotal − releasedTotal, so one vendor's
   * overpayment is never hidden by another's pending amount. Within a vendor they follow its
   * total: cash paid towards its bank share is a shift (see vendorBuckets), not extra.
   * Reconciles as outstandingTotal − extraTotal === expenseTotal − releasedTotal.
   */
  outstandingTotal: number;
  outstandingCashInHand: number;
  outstandingCashInAccount: number;
  extraTotal: number;
  extraCashInHand: number;
  extraCashInAccount: number;
  totalMargin: number;
  totalMarginCashInHand: number;
  totalMarginCashInAccount: number;
  collectedMargin: number;
  collectedMarginCashInHand: number;
  collectedMarginCashInAccount: number;
  /** totalMargin − extraTotal: the margin after anything released beyond what was expensed. */
  netMargin: number;
  netMarginCashInHand: number;
  netMarginCashInAccount: number;
  payments: FinancePayment[];
  expenses: FinanceExpense[];
  releases: FinanceRelease[];
  vendorTotals: VendorTotal[];
}

/** One row of an uploaded sheet, as the server read it. */
export interface FinanceImportRow {
  rowNumber: number;
  type?: 'PAYMENT' | 'EXPENSE' | 'RELEASE' | null;
  date?: string | null;
  expenseName?: string | null;
  vendorName?: string | null;
  amount?: number | null;
  mode?: PaymentMode | null;
  cashInHandAmount?: number | null;
  cashInAccountAmount?: number | null;
  quotationNumber?: string | null;
  note?: string | null;
  errors: string[];
  warnings: string[];
}

export interface FinanceImportTotals {
  receivedTotal: number;
  expenseTotal: number;
  releasedTotal: number;
  outstandingTotal: number;
  extraTotal: number;
  totalMargin: number;
  netMargin: number;
}

/** A check (imported=false) or an import of a sheet. Nothing is saved unless every row is valid. */
export interface FinanceImportResult {
  imported: boolean;
  payments: number;
  expenses: number;
  releases: number;
  errorCount: number;
  warningCount: number;
  fileNotes: string[];
  rows: FinanceImportRow[];
  before: FinanceImportTotals;
  after?: FinanceImportTotals | null;
}

export interface FinanceListRow {
  financeId: number;
  customerId: number;
  customerName: string;
  customerContact?: string;
  customerPlace?: string;
  totalAmount: number;
  receivedTotal: number;
  totalBalance: number;
  expenseTotal: number;
  totalMargin: number;
  paymentCount: number;
}

export interface EligibleCustomer {
  id: number;
  name: string;
  contact?: string;
  place?: string;
}

export interface PaymentRequest {
  amount: number;
  mode: PaymentMode;
  paymentDate: string;
  note?: string;
  comment?: string;
}

export interface ExpenseRequest {
  title: string;
  amount: number;
  vendorId?: number | null;
  cashInHandPct: number;
  cashInAccountPct: number;
  /** Exact cash-in-hand rupees; when sent, the server keeps it and derives the percentages. */
  cashInHandAmount?: number | null;
  quotationId?: number | null;
  expenseDate?: string;
  note?: string;
}

export interface ReleaseRequest {
  vendorId: number;
  amount: number;
  mode: PaymentMode;
  releaseDate: string;
  expenseId?: number | null;
  note?: string;
}
