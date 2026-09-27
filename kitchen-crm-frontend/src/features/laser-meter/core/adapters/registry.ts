/**
 * Adapter registry: built-ins + code adapters (registered at startup) + config adapters
 * (fetched from the server, cached in localStorage so the app works offline on site).
 */

import type { LaserAdapterConfig, LaserMeterAdapter } from '../types';
import { createConfigAdapter } from './configAdapter';
import {
  createGenericAdapter,
  createMockAdapter,
  GENERIC_ADAPTER_ID,
  MOCK_ADAPTER_ID,
} from './builtins';
import { Emitter } from '../emitter';

const CACHE_KEY = 'laserMeter.adapters.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const safeLocalStorage = (): StorageLike | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export class AdapterRegistry {
  private builtins = new Map<string, LaserMeterAdapter>();
  private code = new Map<string, LaserMeterAdapter>();
  private configs = new Map<string, LaserMeterAdapter>();
  private emitter = new Emitter<{ change: void }>();

  private readonly storage: StorageLike | null;

  constructor(storage: StorageLike | null = safeLocalStorage()) {
    this.storage = storage;
    this.builtins.set(GENERIC_ADAPTER_ID, createGenericAdapter());
    this.builtins.set(MOCK_ADAPTER_ID, createMockAdapter());
    this.loadCache();
  }

  onChange(fn: () => void): () => void {
    return this.emitter.on('change', fn);
  }

  /** For protocols that don't fit the config model. Code adapters win over configs with the same id. */
  registerCode(adapter: LaserMeterAdapter): void {
    this.code.set(adapter.id, { ...adapter, kind: 'code' });
    this.emitter.emit('change', undefined);
  }

  /** Replace config adapters with a fresh server list and refresh the offline cache. */
  setConfigs(configs: LaserAdapterConfig[]): void {
    this.configs.clear();
    for (const c of configs) {
      if (this.builtins.has(c.id)) {
        continue;
      }
      try {
        this.configs.set(c.id, createConfigAdapter(c));
      } catch (e) {
        console.warn(`[laser-meter] skipping adapter "${c.id}"`, e);
      }
    }
    try {
      this.storage?.setItem(CACHE_KEY, JSON.stringify(configs));
    } catch {
      // Storage full / private mode: the in-memory copy still works for this session.
    }
    this.emitter.emit('change', undefined);
  }

  /** Lab optional services are a setting; rebuild the generic adapter when they change. */
  setGenericOptionalServices(services: string[]): void {
    this.builtins.set(GENERIC_ADAPTER_ID, createGenericAdapter(services));
  }

  get(id: string | null | undefined): LaserMeterAdapter | null {
    if (!id) {
      return null;
    }
    return this.code.get(id) ?? this.configs.get(id) ?? this.builtins.get(id) ?? null;
  }

  /** Adapters a surveyor can pick (active, device-specific). Dev mode adds the simulator. */
  listSelectable(opts: { includeMock?: boolean } = {}): LaserMeterAdapter[] {
    const out: LaserMeterAdapter[] = [];
    const seen = new Set<string>();
    for (const a of [...this.code.values(), ...this.configs.values()]) {
      if (a.active && !seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
    out.sort((a, b) => a.displayName.localeCompare(b.displayName));
    const mock = this.builtins.get(MOCK_ADAPTER_ID);
    if (opts.includeMock && mock) {
      out.push(mock);
    }
    return out;
  }

  getGeneric(): LaserMeterAdapter {
    return this.builtins.get(GENERIC_ADAPTER_ID) as LaserMeterAdapter;
  }

  private loadCache(): void {
    try {
      const raw = this.storage?.getItem(CACHE_KEY);
      if (!raw) {
        return;
      }
      const list = JSON.parse(raw) as LaserAdapterConfig[];
      if (Array.isArray(list)) {
        for (const c of list) {
          if (c && c.id && !this.builtins.has(c.id)) {
            this.configs.set(c.id, createConfigAdapter(c));
          }
        }
      }
    } catch {
      // Corrupt cache — ignore; the next server fetch rewrites it.
    }
  }
}
