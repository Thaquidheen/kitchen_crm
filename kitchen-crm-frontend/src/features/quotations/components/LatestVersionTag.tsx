import React from 'react';

/**
 * The small "Latest" tag on a folder's latest version (see latestVersion.ts for which row gets
 * it). Same tint as the version chips next to it; theme colours are plain CSS variables, so the
 * tint uses color-mix rather than a Tailwind /NN opacity modifier, and follows light and dark mode.
 */
export const LatestVersionTag: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center px-1.5 py-[1px] rounded-md text-[10.5px] font-semibold leading-4 whitespace-nowrap shrink-0 ${className}`}
    style={{
      background: 'color-mix(in oklab, var(--color-primary-600) 12%, transparent)',
      color: 'var(--color-primary-600)',
    }}
    title="Latest version"
  >
    Latest
  </span>
);

export default LatestVersionTag;
