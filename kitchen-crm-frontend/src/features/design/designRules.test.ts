import { describe, expect, it } from 'vitest';
import {
  designNewsText,
  isApprovedDesign,
  isOpenDesign,
  isPdfFile,
  quotationGate,
  redesignKeepsStage,
  versionLabel,
} from './designUi';
import type { DesignJob, DesignStatus } from './types';

const job = (over: Partial<DesignJob> = {}): DesignJob => ({
  id: 1,
  customerId: 9,
  customerName: 'MR. TEST',
  designerId: 4,
  designerName: 'Anu',
  status: 'PLANNING',
  priority: 'MEDIUM',
  revisionCount: 0,
  overdue: false,
  newForDesigner: false,
  newForAdmin: false,
  unreadForAdmin: 0,
  unreadForDesigner: 0,
  noteCount: 0,
  fileCount: 0,
  ...over,
});

describe('design versions', () => {
  it('labels versions, treating designs older than versions as V1', () => {
    expect(versionLabel(1)).toBe('V1');
    expect(versionLabel(3)).toBe('V3');
    expect(versionLabel(null)).toBe('V1');
    expect(versionLabel(undefined)).toBe('V1');
    expect(versionLabel(0)).toBe('V1');
  });

  it('accepts only PDFs as the design', () => {
    expect(isPdfFile('Kitchen layout.pdf')).toBe(true);
    expect(isPdfFile('LAYOUT.PDF ')).toBe(true);
    expect(isPdfFile('layout.png')).toBe(false);
    expect(isPdfFile('layout.pdf.zip')).toBe(false);
    expect(isPdfFile('')).toBe(false);
    expect(isPdfFile(null)).toBe(false);
  });
});

describe('design states', () => {
  const open: DesignStatus[] = ['PLANNING', 'IN_PROGRESS', 'REVISION_REQUIRED', 'PENDING_SUPERADMIN_APPROVAL'];
  const approved: DesignStatus[] = ['APPROVED_BY_ADMIN', 'SUBMITTED', 'FEEDBACK_RECEIVED', 'APPROVED', 'FROZEN'];

  it('splits every status into open, approved or cancelled', () => {
    open.forEach((s) => {
      expect(isOpenDesign(s)).toBe(true);
      expect(isApprovedDesign(s)).toBe(false);
    });
    approved.forEach((s) => {
      expect(isApprovedDesign(s)).toBe(true);
      expect(isOpenDesign(s)).toBe(false);
    });
    expect(isOpenDesign('CANCELLED')).toBe(false);
    expect(isApprovedDesign('CANCELLED')).toBe(false);
  });
});

describe('moving a customer to Quotation Stage', () => {
  it('needs the PDF when no design is saved', () => {
    expect(quotationGate(null)).toBe('NEEDS_PDF');
    expect(quotationGate(undefined)).toBe('NEEDS_PDF');
  });

  it('is ready once the design is approved, whether designed here or uploaded', () => {
    expect(quotationGate(job({ status: 'APPROVED_BY_ADMIN' }))).toBe('READY');
    expect(quotationGate(job({ status: 'APPROVED_BY_ADMIN', origin: 'UPLOADED' }))).toBe('READY');
    expect(quotationGate(job({ status: 'FROZEN' }))).toBe('READY');
  });

  it('waits while a designer or the reviewing admin still has the design', () => {
    expect(quotationGate(job({ status: 'PLANNING' }))).toBe('WITH_DESIGNER');
    expect(quotationGate(job({ status: 'IN_PROGRESS' }))).toBe('WITH_DESIGNER');
    expect(quotationGate(job({ status: 'REVISION_REQUIRED' }))).toBe('WITH_DESIGNER');
    expect(quotationGate(job({ status: 'PENDING_SUPERADMIN_APPROVAL' }))).toBe('WITH_DESIGNER');
  });

  it('needs the PDF again after a cancelled design', () => {
    expect(quotationGate(job({ status: 'CANCELLED' }))).toBe('NEEDS_PDF');
  });
});

describe('redesign', () => {
  it('pulls the customer back into Design except from Confirmed, Lost or Design itself', () => {
    expect(redesignKeepsStage('QUOTE_GIVEN')).toBe(false);
    expect(redesignKeepsStage('FOLLOW_UP')).toBe(false);
    expect(redesignKeepsStage('NEGOTIATIONS')).toBe(false);
    expect(redesignKeepsStage('CONFIRMED')).toBe(true);
    expect(redesignKeepsStage('LOST')).toBe(true);
    expect(redesignKeepsStage('DESIGN_STAGE')).toBe(true);
  });

  it('tells the designer it is a redesign, which version, and what to change', () => {
    const text = designNewsText(
      job({ newForDesigner: true, version: 2, brief: 'Move the hob to the island', planDocumentCount: 2 }),
      'designer',
    );
    expect(text).toBe('Redesign requested (V2): Move the hob to the island · 2 plan documents');
  });

  it('keeps the plain wording for a first design and counts its plan documents', () => {
    expect(designNewsText(job({ newForDesigner: true }), 'designer')).toBe('New design assigned to you');
    expect(designNewsText(job({ newForDesigner: true, version: 1, planDocumentCount: 1 }), 'designer')).toBe(
      'New design assigned to you · 1 plan document',
    );
  });

  it('still reports approval and change requests ahead of the version', () => {
    expect(designNewsText(job({ newForDesigner: true, version: 2, status: 'REVISION_REQUIRED' }), 'designer')).toBe(
      'Changes requested by admin',
    );
    expect(designNewsText(job({ newForDesigner: true, version: 2, status: 'APPROVED_BY_ADMIN' }), 'designer')).toBe(
      'Approved by admin',
    );
  });
});
