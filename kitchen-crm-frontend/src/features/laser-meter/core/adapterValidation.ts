/**
 * Validation for admin-entered adapter configs. The server runs the same checks
 * (LaserMeterAdapterValidator.java); this copy gives instant feedback in the form.
 */

import { BINARY_FORMATS, type LaserAdapterConfig } from './types';
import { isLengthUnit } from './units';
import { isUuidLike, isValidHex } from './hex';
import { FORMAT_SIZE } from './parser';

export const ADAPTER_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;
/** Built-in ids a stored adapter may not shadow. */
export const RESERVED_ADAPTER_IDS = ['generic', 'mock'];

export const validateAdapterConfig = (cfg: Partial<LaserAdapterConfig>): string[] => {
  const errors: string[] = [];
  if (!cfg.id || !ADAPTER_ID_PATTERN.test(cfg.id)) {
    errors.push(
      'ID must be 2–64 characters: lowercase letters, digits, "-" or "_", starting with a letter or digit'
    );
  } else if (RESERVED_ADAPTER_IDS.includes(cfg.id)) {
    errors.push(`"${cfg.id}" is reserved for a built-in adapter`);
  }
  if (!cfg.displayName?.trim()) {
    errors.push('Display name is required');
  }
  if (!cfg.serviceUuid || !isUuidLike(cfg.serviceUuid)) {
    errors.push('Service UUID is missing or malformed');
  }
  if (!cfg.measurementCharUuid || !isUuidLike(cfg.measurementCharUuid)) {
    errors.push('Measurement characteristic UUID is missing or malformed');
  }
  if (cfg.triggerCharUuid && !isUuidLike(cfg.triggerCharUuid)) {
    errors.push('Trigger characteristic UUID is malformed');
  }
  if (cfg.triggerPayloadHex && !isValidHex(cfg.triggerPayloadHex)) {
    errors.push('Trigger payload must be hex bytes, e.g. "01" or "aa 55 01"');
  }
  if (cfg.triggerPayloadHex && !cfg.triggerCharUuid) {
    errors.push('Trigger payload needs a trigger characteristic');
  }
  for (const f of cfg.bleFilters ?? []) {
    if (!f.namePrefix && !(f.services && f.services.length)) {
      errors.push('Each Bluetooth filter needs a name prefix or at least one service');
    }
    for (const s of f.services ?? []) {
      if (!isUuidLike(s)) {
        errors.push(`Filter service "${s}" is not a valid UUID`);
      }
    }
  }
  for (const s of cfg.optionalServices ?? []) {
    if (!isUuidLike(s)) {
      errors.push(`Optional service "${s}" is not a valid UUID`);
    }
  }
  const minMm = cfg.minMm;
  const maxMm = cfg.maxMm;
  if (!Number.isInteger(minMm) || !Number.isInteger(maxMm) || minMm < 0 || maxMm <= minMm) {
    errors.push('Range must be whole millimetres with 0 ≤ min < max');
  }

  const p = cfg.parser;
  if (!p) {
    errors.push('Parser is required');
    return errors;
  }
  if (!isLengthUnit(p.sourceUnit)) {
    errors.push('Parser source unit must be one of mm, cm, m, in, ft');
  }
  if (typeof p.scale !== 'number' || !Number.isFinite(p.scale) || p.scale === 0) {
    errors.push('Parser scale must be a non-zero number');
  }
  if (p.type === 'binary') {
    if (!(BINARY_FORMATS as readonly string[]).includes(p.format)) {
      errors.push('Binary format must be uint16, uint32, int32 or float32');
    }
    if (!Number.isInteger(p.offset) || p.offset < 0) {
      errors.push('Binary offset must be a whole number ≥ 0');
    }
    if (p.length !== undefined && p.length !== null && p.length !== FORMAT_SIZE[p.format]) {
      errors.push(`Binary length must be ${FORMAT_SIZE[p.format]} for ${p.format}`);
    }
    if (typeof p.littleEndian !== 'boolean') {
      errors.push('Binary byte order (littleEndian) is required');
    }
  } else if (p.type === 'ascii') {
    if (!p.regex) {
      errors.push('ASCII parser needs a regex');
    } else {
      try {
        new RegExp(p.regex);
      } catch {
        errors.push('ASCII parser regex does not compile');
      }
    }
  } else {
    errors.push('Parser type must be "binary" or "ascii"');
  }
  return errors;
};
