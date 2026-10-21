/**
 * Whether the figures the server saved still describe the quotation on the screen. The builder
 * provides it; everywhere else (nothing is being edited) they always do. See serverFigureRules.
 */
import { createContext, useCallback, useContext } from 'react';
import { lineAmountWithMargin, type MarginCodeCategory } from './marginCodeRules';

export * from './serverFigureRules';

interface ServerFiguresState {
  /** Nothing that changes the price has been changed since the quotation was opened. */
  current: boolean;
  /** Categories whose margin code was changed since: their lines' amounts with margin are out of date. */
  changedCodes: MarginCodeCategory[];
}

const ServerFiguresContext = createContext<ServerFiguresState>({ current: true, changedCodes: [] });
export const ServerFiguresProvider = ServerFiguresContext.Provider;

/** A figure the server saved — or null ("—") once the screen changed something it depends on. */
export function useServerFigure() {
  const { current } = useContext(ServerFiguresContext);
  return useCallback((v: number | null | undefined): number | null => (current && v !== null && v !== undefined ? Number(v) : null), [current]);
}

/** A line's amount with margin, unless its category's code was changed since it was priced. */
export function useLineWithMargin() {
  const { changedCodes } = useContext(ServerFiguresContext);
  return useCallback(
    (item: Parameters<typeof lineAmountWithMargin>[0], category: MarginCodeCategory): number | undefined =>
      changedCodes.includes(category) ? undefined : lineAmountWithMargin(item, category === 'doors'),
    [changedCodes],
  );
}
