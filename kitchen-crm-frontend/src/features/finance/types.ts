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
  totalReleased: number;
  /** expensed − released; negative = over-released. */
  balance: number;
  expenseCount: number;
  releaseCount: number;
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
  expenseTotal: number;
  releasedTotal: number;
  releasedCashInHand: number;
  releasedCashInAccount: number;
  totalMargin: number;
  collectedMargin: number;
  payments: FinancePayment[];
  expenses: FinanceExpense[];
  releases: FinanceRelease[];
  vendorTotals: VendorTotal[];
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
