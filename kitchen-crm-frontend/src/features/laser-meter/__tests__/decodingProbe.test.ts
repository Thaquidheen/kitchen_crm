import { describe, expect, it } from 'vitest';
import { probeDecodings, rankAcrossMarks } from '../core/decodingProbe';
import { asciiToBytes, hexToBytes } from '../core/hex';
import { parseReading } from '../core/parser';

const u16le = (v: number, pre: number[] = [], post: number[] = []) => {
  const b = new Uint8Array(pre.length + 2 + post.length);
  b.set(pre, 0);
  new DataView(b.buffer).setUint16(pre.length, v, true);
  b.set(post, pre.length + 2);
  return b;
};

describe('probeDecodings', () => {
  it('finds uint16 LE millimetres at an offset and ranks it first', () => {
    const c = probeDecodings(u16le(2345, [0xaa, 0x01], [0x0d]), 2345);
    expect(c[0].parser).toMatchObject({ type: 'binary', format: 'uint16', littleEndian: true, offset: 2, sourceUnit: 'mm', scale: 1 });
  });

  it('finds big-endian uint32 tenths of a millimetre', () => {
    const b = new Uint8Array(6);
    new DataView(b.buffer).setUint32(1, 23450, false);
    const c = probeDecodings(b, 2345);
    expect(c.some((x) => x.key === 'bin:uint32:be:1:mm:0.1')).toBe(true);
  });

  it('finds float32 metres', () => {
    const b = new Uint8Array(5);
    new DataView(b.buffer).setFloat32(1, 2.345, true);
    const c = probeDecodings(b, 2345);
    expect(c.map((x) => x.key)).toContain('bin:float32:le:1:m:1');
  });

  it('finds ASCII readings with a text anchor and builds a working regex', () => {
    const bytes = asciiToBytes('\x02D=2.345m\r\n');
    const c = probeDecodings(bytes, 2345);
    const ascii = c.find((x) => x.parser.type === 'ascii');
    expect(ascii).toBeDefined();
    expect(ascii?.parser).toMatchObject({ type: 'ascii' });
    // The saved regex must decode other packets of the same shape.
    const r = parseReading(asciiToBytes('\x02D=1.200m\r\n'), ascii!.parser, { minMm: 0, maxMm: 1e9 });
    expect(r).toEqual({ ok: true, valueMm: 1200 });
    expect(c[0].parser.type).toBe('ascii');
  });

  it('escapes control bytes in the anchor', () => {
    const c = probeDecodings(asciiToBytes('\x02\x03 2345'), 2345);
    const ascii = c.find((x) => x.parser.type === 'ascii');
    expect(ascii?.parser.type === 'ascii' && ascii.parser.regex).toContain('\\x03');
  });

  it('accepts the displayed rounding tolerance', () => {
    expect(probeDecodings(u16le(2346), 2345).length).toBeGreaterThan(0);
    expect(probeDecodings(u16le(2346), 2345, { toleranceMm: 0 }).length).toBe(0);
  });

  it('returns nothing for unrelated data', () => {
    expect(probeDecodings(hexToBytes('00 00 00 00'), 2345)).toEqual([]);
  });
});

describe('rankAcrossMarks', () => {
  it('puts the decoding consistent with every mark first', () => {
    // Byte 0 is a counter that coincidentally equals the value mod 256 in one packet.
    const marks = [
      { bytes: u16le(2345, [0x29]), targetMm: 2345 },
      { bytes: u16le(1200, [0x07]), targetMm: 1200 },
      { bytes: u16le(3050, [0x11]), targetMm: 3050 },
    ];
    const ranked = rankAcrossMarks(marks);
    expect(ranked[0]).toMatchObject({ matches: 3, total: 3, key: 'bin:uint16:le:1:mm:1' });
  });

  it('uses a second mark to break a tie', () => {
    // 0x0909 = 2313 reads the same in either byte order; the second reading settles it.
    const one = rankAcrossMarks([{ bytes: u16le(2313), targetMm: 2313 }]);
    expect(one.filter((r) => r.matches === 1).map((r) => r.key)).toEqual(
      expect.arrayContaining(['bin:uint16:le:0:mm:1', 'bin:uint16:be:0:mm:1'])
    );
    const two = rankAcrossMarks([
      { bytes: u16le(2313), targetMm: 2313 },
      { bytes: u16le(1200), targetMm: 1200 },
    ]);
    expect(two[0]).toMatchObject({ key: 'bin:uint16:le:0:mm:1', matches: 2 });
    expect(two.find((r) => r.key === 'bin:uint16:be:0:mm:1')?.matches).toBe(1);
  });
});
