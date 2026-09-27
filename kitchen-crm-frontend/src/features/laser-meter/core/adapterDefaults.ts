/** A blank adapter config for the "New adapter" form. */

import type { LaserAdapterConfig } from './types';

export const emptyAdapterConfig = (): LaserAdapterConfig => ({
  id: '',
  displayName: '',
  active: true,
  bleFilters: [],
  serviceUuid: '',
  measurementCharUuid: '',
  triggerCharUuid: '',
  triggerPayloadHex: '',
  optionalServices: [],
  parser: { type: 'binary', offset: 0, length: 2, format: 'uint16', littleEndian: true, sourceUnit: 'mm', scale: 1 },
  minMm: 50,
  maxMm: 15000,
  notes: '',
});
