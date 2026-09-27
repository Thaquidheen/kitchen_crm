/** Byte helpers shared by the parser, BLE connection and Device Lab. */

export const toBytes = (data: DataView | ArrayBuffer | Uint8Array): Uint8Array => {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
};

/** "0a 1b ff" style hex. */
export const bytesToHex = (bytes: Uint8Array, sep = ' '): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(sep);

/**
 * Parse hex text, tolerating spaces, colons, dashes and a 0x prefix. Throws on odd length or
 * non-hex characters so a typo in an admin form is reported instead of silently truncated.
 */
export const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Hex payload must have an even number of digits');
  }
  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error('Hex payload contains non-hex characters');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
};

export const isValidHex = (hex: string): boolean => {
  try {
    hexToBytes(hex);
    return true;
  } catch {
    return false;
  }
};

/** Latin-1 decode; used by ascii parsers (meters send plain ASCII). */
export const bytesToAscii = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => String.fromCharCode(b)).join('');

/** Printable view for logs: non-printables shown as "·". */
export const bytesToPrintable = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '·')).join('');

export const asciiToBytes = (text: string): Uint8Array =>
  Uint8Array.from(text, (c) => c.charCodeAt(0) & 0xff);

const BASE_UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';

/**
 * Normalise a GATT UUID from admin config. 16/32-bit short forms ("fff0", "0xFFF0",
 * "0000fff0") become the full 128-bit form; full UUIDs are lower-cased; standard names such as
 * "battery_service" pass through unchanged (Web Bluetooth resolves those itself).
 */
export const normalizeUuid = (uuid: string): string => {
  const u = uuid.trim().toLowerCase();
  const short = u.replace(/^0x/, '');
  if (/^[0-9a-f]{4}$/.test(short)) {
    return `0000${short}${BASE_UUID_SUFFIX}`;
  }
  if (/^[0-9a-f]{8}$/.test(short)) {
    return `${short}${BASE_UUID_SUFFIX}`;
  }
  return u;
};

export const isUuidLike = (uuid: string): boolean => {
  const n = normalizeUuid(uuid);
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(n) ||
    /^[a-z][a-z0-9_.]*$/.test(n)
  );
};

/** Short display form: "0xfff0" for SIG-base UUIDs, otherwise the full UUID. */
export const shortUuid = (uuid: string): string => {
  const n = normalizeUuid(uuid);
  if (n.endsWith(BASE_UUID_SUFFIX) && n.startsWith('0000')) {
    return `0x${n.slice(4, 8)}`;
  }
  return n;
};
