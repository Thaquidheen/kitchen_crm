/**
 * FilterChips — the house filter-chip row (ArchitectsPage/VendorsPage/RemindersPage all carry
 * private copies of this exact markup; new surfaces should use this one).
 *
 * Controlled: `value` is the active key, '' conventionally meaning "All".
 */

export interface FilterChipItem {
  key: string;
  label: string;
  /** Optional --st-* token for the colored dot (e.g. 'design', 'nego'). */
  st?: string;
  count?: number;
}

export interface FilterChipsProps {
  items: FilterChipItem[];
  value: string;
  onChange: (key: string) => void;
  /** Slightly tighter paddings for popovers (the bell). */
  dense?: boolean;
}

export function FilterChips({ items, value, onChange, dense = false }: FilterChipsProps) {
  const pad = dense ? 'px-2.5 py-1.5' : 'px-[13px] py-2';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key || 'all'}
            onClick={() => onChange(c.key)}
            className={`flex items-center gap-1.5 ${pad} rounded-[11px] border transition-colors`}
            style={
              active
                ? {
                    borderColor: 'var(--color-primary-600)',
                    background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                  }
                : {
                    borderColor: 'var(--color-background-600)',
                    background: 'var(--color-background-800)',
                  }
            }
          >
            {c.st && (
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ background: `var(--st-${c.st}-fg)` }}
              />
            )}
            <span
              className={`${dense ? 'text-[12px]' : 'text-[12.5px]'} whitespace-nowrap ${
                active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
              }`}
            >
              {c.label}
            </span>
            {c.count !== undefined && (
              <span
                className={`${dense ? 'text-[12px]' : 'text-[13px]'} font-[650] tabular-nums ${
                  active ? 'text-primary-600' : 'text-text-900'
                }`}
              >
                {c.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterChips;
