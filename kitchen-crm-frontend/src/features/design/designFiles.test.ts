import { describe, expect, it } from 'vitest';
import {
  DESIGN_ACCEPT,
  MAX_FILE_BYTES,
  MAX_UPLOAD_BYTES,
  PLAN_ACCEPT,
  addPickedFiles,
  fileExtension,
  fileKind,
  fileKindLabel,
  formatFileSize,
  isDesignFileName,
  isPlanFileName,
  opensInBrowser,
  uploadSizeProblem,
} from './designFiles';

const f = (name: string, size = 1000) => ({ name, size });

describe('fileKind', () => {
  it('reads the kind from the name, whatever the case', () => {
    expect(fileKind('Kitchen plan.PDF')).toBe('pdf');
    expect(fileKind('render 01.JPG')).toBe('image');
    expect(fileKind('render.jpeg')).toBe('image');
    expect(fileKind('view.png')).toBe('image');
    expect(fileKind('view.webp')).toBe('image');
    expect(fileKind('KITCHEN.DWG')).toBe('cad');
    expect(fileKind('kitchen.dxf')).toBe('cad');
  });

  it('calls everything else "other"', () => {
    expect(fileKind('brief.docx')).toBe('other');
    expect(fileKind('files.zip')).toBe('other');
    expect(fileKind('model.skp')).toBe('other');
    expect(fileKind('noextension')).toBe('other');
    expect(fileKind('')).toBe('other');
    expect(fileKind(null)).toBe('other');
    expect(fileKind(undefined)).toBe('other');
  });

  it('looks at the last extension only', () => {
    expect(fileExtension('plan.final.v2.dwg')).toBe('dwg');
    expect(fileKind('render.png.exe')).toBe('other');
    expect(fileKind('.pdf')).toBe('other'); // a name that is only an extension is not a PDF
    expect(fileExtension('  spaced.PDF  ')).toBe('pdf');
  });
});

describe('what each upload takes', () => {
  it('a design is a PDF, an image or a CAD drawing', () => {
    expect(isDesignFileName('a.pdf')).toBe(true);
    expect(isDesignFileName('a.jpg')).toBe(true);
    expect(isDesignFileName('a.dwg')).toBe(true);
    expect(isDesignFileName('a.dxf')).toBe(true);
    expect(isDesignFileName('a.docx')).toBe(false);
    expect(isDesignFileName('a.zip')).toBe(false);
    expect(isDesignFileName('a.svg')).toBe(false);
    expect(isDesignFileName('a.html')).toBe(false);
  });

  it('a plan document may also be an office file or a zip', () => {
    expect(isPlanFileName('site.dwg')).toBe(true);
    expect(isPlanFileName('measurements.xlsx')).toBe(true);
    expect(isPlanFileName('brief.doc')).toBe(true);
    expect(isPlanFileName('photos.zip')).toBe(true);
    expect(isPlanFileName('script.js')).toBe(false);
    expect(isPlanFileName('page.html')).toBe(false);
  });

  it('the file pickers offer exactly those kinds', () => {
    expect(DESIGN_ACCEPT).toBe('.pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf');
    expect(PLAN_ACCEPT.startsWith(DESIGN_ACCEPT)).toBe(true);
    for (const ext of DESIGN_ACCEPT.split(',')) {
      expect(isDesignFileName(`x${ext}`)).toBe(true);
    }
    for (const ext of PLAN_ACCEPT.split(',')) {
      expect(isPlanFileName(`x${ext}`)).toBe(true);
    }
  });
});

describe('how a file is shown', () => {
  it('names the kind on its link', () => {
    expect(fileKindLabel('a.pdf')).toBe('PDF');
    expect(fileKindLabel('a.png')).toBe('Image');
    expect(fileKindLabel('a.dwg')).toBe('DWG');
    expect(fileKindLabel('a.dxf')).toBe('DXF');
    expect(fileKindLabel('a.zip')).toBe('File');
  });

  it('opens PDFs and images in the browser and saves the rest', () => {
    expect(opensInBrowser('a.pdf')).toBe(true);
    expect(opensInBrowser('a.jpg')).toBe(true);
    expect(opensInBrowser('a.dwg')).toBe(false);
    expect(opensInBrowser('a.zip')).toBe(false);
  });

  it('writes sizes the way people read them', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(900)).toBe('900 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(3.25 * 1024 * 1024)).toBe('3.3 MB');
    expect(formatFileSize(48 * 1024 * 1024)).toBe('48 MB');
    expect(formatFileSize(null)).toBe('0 B');
  });
});

describe('addPickedFiles', () => {
  it('adds new files after the ones already chosen', () => {
    const r = addPickedFiles([f('a.pdf')], [f('b.dwg'), f('c.jpg')], isDesignFileName);
    expect(r.files.map((x) => x.name)).toEqual(['a.pdf', 'b.dwg', 'c.jpg']);
    expect(r.refused).toEqual([]);
  });

  it('counts the same file once, also when it is picked twice in one go', () => {
    const r = addPickedFiles([f('a.pdf', 10)], [f('a.pdf', 10), f('b.png', 5), f('b.png', 5)], isDesignFileName);
    expect(r.files.map((x) => x.name)).toEqual(['a.pdf', 'b.png']);
  });

  it('keeps two different files that share a name', () => {
    const r = addPickedFiles([f('plan.pdf', 10)], [f('plan.pdf', 11)], isDesignFileName);
    expect(r.files).toHaveLength(2);
  });

  it('leaves out what the upload does not take and says which', () => {
    const r = addPickedFiles([], [f('a.pdf'), f('notes.docx'), f('b.dwg'), f('virus.exe')], isDesignFileName);
    expect(r.files.map((x) => x.name)).toEqual(['a.pdf', 'b.dwg']);
    expect(r.refused).toEqual(['notes.docx', 'virus.exe']);
  });

  it('does not change the list it was given', () => {
    const current = [f('a.pdf')];
    addPickedFiles(current, [f('b.pdf')], isDesignFileName);
    expect(current).toHaveLength(1);
  });
});

describe('uploadSizeProblem', () => {
  it('lets ordinary uploads through', () => {
    expect(uploadSizeProblem([])).toBeNull();
    expect(uploadSizeProblem([f('a.pdf', 2_000_000), f('b.dwg', 15_000_000)])).toBeNull();
    expect(uploadSizeProblem([f('edge.dwg', MAX_FILE_BYTES)])).toBeNull();
  });

  it('names the file that is over 50 MB', () => {
    expect(uploadSizeProblem([f('a.pdf', 10), f('huge.dwg', MAX_FILE_BYTES + 1)])).toBe('huge.dwg is larger than 50 MB');
  });

  it('stops a set that is over 200 MB together', () => {
    const five = Array.from({ length: 5 }, (_, i) => f(`render${i}.png`, 45 * 1024 * 1024));
    expect(uploadSizeProblem(five)).toBe('Together these files are 225 MB — one upload can carry 200 MB');
    expect(uploadSizeProblem(five.slice(0, 4))).toBeNull();
    expect(MAX_UPLOAD_BYTES).toBe(200 * 1024 * 1024);
  });
});
