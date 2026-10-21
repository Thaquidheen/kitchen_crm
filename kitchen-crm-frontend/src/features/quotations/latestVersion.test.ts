import { describe, expect, it } from 'vitest';
import { isLatestOfFolder, isMarkedLatest } from './latestVersion';

describe('the Folders view', () => {
  // A folder with V1 (id 11), V2 (id 12) and V3 (id 13); the server named V3 its latest.
  const folder = { latestQuotationId: 13, versionCount: 3 };

  it('tags only the version the folder row shows as latest', () => {
    expect(isLatestOfFolder(13, folder)).toBe(true);
    expect(isLatestOfFolder(12, folder)).toBe(false);
    expect(isLatestOfFolder(11, folder)).toBe(false);
  });

  it('tags nothing in a folder with a single version', () => {
    expect(isLatestOfFolder(21, { latestQuotationId: 21, versionCount: 1 })).toBe(false);
  });

  it('tags the latest of a folder with exactly two versions', () => {
    expect(isLatestOfFolder(32, { latestQuotationId: 32, versionCount: 2 })).toBe(true);
  });

  it('follows the folder row, not the highest version number it can see', () => {
    // The folder row says V2 (id 42) is the latest; a newer V3 (id 43) it has not heard of yet
    // stays untagged until both reload, so the tag never contradicts "Latest Amount".
    const row = { latestQuotationId: 42, versionCount: 2 };
    expect(isLatestOfFolder(42, row)).toBe(true);
    expect(isLatestOfFolder(43, row)).toBe(false);
  });

  it('tags nothing when the folder names no latest version or no count', () => {
    expect(isLatestOfFolder(51, { versionCount: 2 })).toBe(false);
    expect(isLatestOfFolder(51, { latestQuotationId: null, versionCount: 2 })).toBe(false);
    expect(isLatestOfFolder(51, { latestQuotationId: 51 })).toBe(false);
    expect(isLatestOfFolder(51, { latestQuotationId: 51, versionCount: null })).toBe(false);
  });
});

describe('flat lists (All Versions, the customer page)', () => {
  it('tags a row the server marked as its folder\'s latest', () => {
    expect(isMarkedLatest({ latestInFolder: true })).toBe(true);
  });

  it('tags nothing the server did not mark', () => {
    expect(isMarkedLatest({ latestInFolder: false })).toBe(false);
    expect(isMarkedLatest({ latestInFolder: null })).toBe(false);
    // An older server sends no flag at all.
    expect(isMarkedLatest({})).toBe(false);
  });
});
