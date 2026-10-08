import { describe, expect, it } from 'vitest';
import {
  canSettleOpenDesign,
  designNewsText,
  isApprovedDesign,
  isOpenDesign,
  quotationGate,
  redesignKeepsStage,
  versionLabel,
} from './designUi';
import { isDesignFileName } from './designFiles';
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

  it('accepts PDFs, images and CAD drawings as the design', () => {
    expect(isDesignFileName('Kitchen layout.pdf')).toBe(true);
    expect(isDesignFileName('LAYOUT.PDF ')).toBe(true);
    expect(isDesignFileName('layout.png')).toBe(true);
    expect(isDesignFileName('layout.dwg')).toBe(true);
    expect(isDesignFileName('layout.pdf.zip')).toBe(false);
    expect(isDesignFileName('')).toBe(false);
    expect(isDesignFileName(null)).toBe(false);
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
    expect(quotationGate(null)).toBe('NEEDS_DESIGN');
    expect(quotationGate(undefined)).toBe('NEEDS_DESIGN');
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
    expect(quotationGate(job({ status: 'CANCELLED' }))).toBe('NEEDS_DESIGN');
  });
});

describe('bringing in the finished design while a designer has it', () => {
  const admin = { admin: true, coordinator: true };
  const adminStaff = { admin: false, coordinator: true };
  const others = { admin: false, coordinator: false };

  it('is for the administrator and Admin staff while the designer works on it', () => {
    for (const status of ['PLANNING', 'IN_PROGRESS'] as DesignStatus[]) {
      expect(canSettleOpenDesign(job({ status }), admin)).toBe(true);
      expect(canSettleOpenDesign(job({ status }), adminStaff)).toBe(true);
      expect(canSettleOpenDesign(job({ status }), others)).toBe(false);
    }
  });

  it('is the administrator alone after the administrator asked for changes', () => {
    const sentBack = job({ status: 'REVISION_REQUIRED', completedAt: '2026-10-08T10:00:00' });
    expect(canSettleOpenDesign(sentBack, admin)).toBe(true);
    expect(canSettleOpenDesign(sentBack, adminStaff)).toBe(false);
    expect(canSettleOpenDesign(sentBack, others)).toBe(false);
  });

  it('stays the administrator alone when the designer has started those changes', () => {
    // In progress again, but this version was handed in once: not a first pass.
    const reworking = job({ status: 'IN_PROGRESS', completedAt: '2026-10-08T10:00:00' });
    expect(canSettleOpenDesign(reworking, admin)).toBe(true);
    expect(canSettleOpenDesign(reworking, adminStaff)).toBe(false);
    expect(canSettleOpenDesign(job({ status: 'IN_PROGRESS', completedAt: null }), adminStaff)).toBe(true);
  });

  it('is the administrator alone once the designer has handed it in for approval', () => {
    const handedIn = job({ status: 'PENDING_SUPERADMIN_APPROVAL' });
    expect(canSettleOpenDesign(handedIn, admin)).toBe(true);
    expect(canSettleOpenDesign(handedIn, adminStaff)).toBe(false);
    expect(canSettleOpenDesign(handedIn, others)).toBe(false);
  });

  it('is anybody when no designer has been given the design yet', () => {
    const waiting = job({ status: 'PLANNING', designerId: null, designerName: null });
    expect(canSettleOpenDesign(waiting, others)).toBe(true);
    expect(canSettleOpenDesign(waiting, adminStaff)).toBe(true);
  });

  it('does not apply to a design that is not open', () => {
    expect(canSettleOpenDesign(null, admin)).toBe(false);
    expect(canSettleOpenDesign(job({ status: 'APPROVED_BY_ADMIN' }), admin)).toBe(false);
    expect(canSettleOpenDesign(job({ status: 'CANCELLED' }), admin)).toBe(false);
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
