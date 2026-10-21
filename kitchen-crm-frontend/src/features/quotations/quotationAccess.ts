/**
 * What a person may do with quotations and which prices their screens may show, worked out from
 * the permissions the administrator set (no React, so it can be unit tested). The server holds
 * the same rules — this only decides what the screens offer.
 */
import type { PermissionKey } from '@/features/permissions/types';

export interface QuotationAccess {
  /** Open the Quotations page and a quotation. */
  view: boolean;
  /** New quotation, save as a new version, duplicate. */
  create: boolean;
  /** Change and save an open quotation, rename its folder. */
  edit: boolean;
  remove: boolean;
  changeStatus: boolean;
  pdf: boolean;
  /** Each line's rate and each category's total before margin. */
  seesRates: boolean;
  /** Margin percentages and amounts (also the MRP margins): the administrator only. */
  seesMargins: boolean;
  /** Typing margin percentages: the administrator only. */
  editsMargins: boolean;
  /** The margin of each category as the administrator's code ("See margin codes"). */
  seesMarginCodes: boolean;
  /** Choosing a margin code per category ("Choose margin codes"); staff, never the administrator. */
  picksMarginCodes: boolean;
  /**
   * The screen can work a total out by itself only when it has both the rates and the margins.
   * Without either it shows the figure the server saved.
   */
  computesTotals: boolean;
}

export const quotationAccess = (can: (key: PermissionKey) => boolean, admin = false): QuotationAccess => {
  const seesRates = can('quotations.see_rates');
  // Percentages are the administrator's; staff allowed to see margins see codes.
  const seesMargins = admin;
  const seesMarginCodes = admin || can('quotations.see_margins');
  return {
    view: can('quotations.view'),
    create: can('quotations.create'),
    edit: can('quotations.edit'),
    remove: can('quotations.delete'),
    changeStatus: can('quotations.change_status'),
    pdf: can('quotations.pdf'),
    seesRates,
    seesMargins,
    editsMargins: admin,
    seesMarginCodes,
    // Nobody chooses a margin they cannot see.
    picksMarginCodes: !admin && seesMarginCodes && can('quotations.edit_margins'),
    computesTotals: seesRates && seesMargins,
  };
};
