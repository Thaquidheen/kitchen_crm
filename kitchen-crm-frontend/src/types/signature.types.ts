/**
 * TypeScript types for Signature/Approval functionality
 */

export const SignatureStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  SIGNED: 'SIGNED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export type SignatureStatus = typeof SignatureStatus[keyof typeof SignatureStatus];

export const DocumentType = {
  QUOTATION: 'QUOTATION',
  WORK_COMPLETION: 'WORK_COMPLETION',
  FINAL_BILL: 'FINAL_BILL',
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export interface SignedDocument {
  id: number;
  documentType: DocumentType;
  quotationId?: number;
  projectId?: number;
  status: SignatureStatus;
  token: string;
  pdfUrl: string;
  approvedPdfUrl?: string;
  sentAt: string;
  expiresAt: string;
  signedAt?: string;
  signerName?: string;
  signerEmail?: string;
  signerPhone?: string;
  signerIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetails {
  id: number;
  quotationId: number;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  validUntil: string;
  documentType: string;
  status: string;
  pdfUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface ApprovalRequest {
  customerName: string;
  email: string;
  phone: string;
  agreed: boolean;
  ipAddress?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  documentId?: number;
  approvedAt?: string;
}

export interface SignatureAuditLog {
  id: number;
  documentId: number;
  action: string;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: number;
  referenceType: string;
  referenceId: number;
  notificationType: string;
  recipientEmail?: string;
  recipientPhone?: string;
  emailSent: boolean;
  whatsappSent: boolean;
  emailStatus?: string;
  whatsappStatus?: string;
  sentAt: string;
}
