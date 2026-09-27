/** Turns an admin-managed LaserAdapterConfig into a runtime LaserMeterAdapter. */

import type { LaserAdapterConfig, LaserMeterAdapter } from '../types';
import { hexToBytes, normalizeUuid } from '../hex';
import { parseReading } from '../parser';

export const BATTERY_SERVICE = 'battery_service';
export const BATTERY_LEVEL_CHAR = 'battery_level';

const uniq = (xs: string[]) => Array.from(new Set(xs));

export const createConfigAdapter = (cfg: LaserAdapterConfig): LaserMeterAdapter => {
  let triggerPayload: Uint8Array | undefined;
  if (cfg.triggerCharUuid && cfg.triggerPayloadHex) {
    try {
      triggerPayload = hexToBytes(cfg.triggerPayloadHex);
    } catch {
      // Validated on save; a bad payload just disables the trigger rather than the adapter.
      triggerPayload = undefined;
    }
  }
  const serviceUuid = normalizeUuid(cfg.serviceUuid);
  const limits = { minMm: cfg.minMm, maxMm: cfg.maxMm };
  return {
    id: cfg.id,
    displayName: cfg.displayName,
    kind: 'config',
    active: cfg.active,
    ble: {
      filters: (cfg.bleFilters ?? []).map((f) => ({
        ...(f.namePrefix ? { namePrefix: f.namePrefix } : {}),
        ...(f.services?.length ? { services: f.services.map(normalizeUuid) } : {}),
      })),
      optionalServices: uniq([
        serviceUuid,
        BATTERY_SERVICE,
        ...(cfg.optionalServices ?? []).map(normalizeUuid),
      ]),
      serviceUuid,
      measurementCharUuid: normalizeUuid(cfg.measurementCharUuid),
      triggerCharUuid: triggerPayload && cfg.triggerCharUuid
        ? normalizeUuid(cfg.triggerCharUuid)
        : undefined,
      triggerPayload,
    },
    minMm: cfg.minMm,
    maxMm: cfg.maxMm,
    parse: (bytes) => parseReading(bytes, cfg.parser, limits),
    config: cfg,
  };
};
