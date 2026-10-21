/**
 * Which quotation row carries the "Latest" tag. Pure, so the rule is tested without a screen.
 *
 * A folder is one customer project and holds its versions V1, V2, …. Its latest version is the
 * one the folder row's "Latest Amount" shows: the highest version number, decided by the server
 * over every version of the folder (a tie goes to the quotation saved last). The tag is shown
 * only when the folder holds two or more versions; with one there is nothing to tell apart.
 * Two quotations in different folders are different projects, so neither is "the latest" of
 * the other.
 */

/** What a folder row knows about its versions (a QuotationFolderSummary). */
export interface FolderLatest {
  latestQuotationId?: number | null;
  versionCount?: number | null;
}

/** A row of a flat quotation list (All Versions, a customer's quotations). */
export interface LatestFlag {
  /** Set by the server on the latest version of a folder holding two or more versions. */
  latestInFolder?: boolean | null;
}

/**
 * Folders view: whether an expanded version row is its folder's latest version. Read from the
 * folder row itself, so the tag and the "Latest Amount" column always name the same version.
 */
export function isLatestOfFolder(quotationId: number, folder: FolderLatest): boolean {
  const latestId = folder.latestQuotationId;
  if (latestId === null || latestId === undefined) {
    return false;
  }
  return (folder.versionCount ?? 0) >= 2 && latestId === quotationId;
}

/**
 * Flat lists: whether a row is marked as its folder's latest version. A page of the list may hold
 * only some versions of a folder (paging, filters), so the server decides over the whole folder;
 * a row without the flag is never tagged.
 */
export function isMarkedLatest(row: LatestFlag): boolean {
  return row.latestInFolder === true;
}
