/**
 * What kind of file a design or plan file is, and which kinds each upload takes. Judged by the
 * file's name, the same way the server does (DesignFileTypes).
 */

export type FileKind = 'pdf' | 'image' | 'cad' | 'other';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const CAD_EXTENSIONS = ['dwg', 'dxf'];
/** What a plan document may be besides a design kind: a brief, a measurement sheet, a bundle. */
const DOCUMENT_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'zip'];

/** Lower-case extension without the dot; empty when the name has none. */
export const fileExtension = (name?: string | null): string => {
  const n = (name ?? '').trim().toLowerCase();
  const dot = n.lastIndexOf('.');
  return dot > 0 ? n.slice(dot + 1) : '';
};

export const fileKind = (name?: string | null): FileKind => {
  const ext = fileExtension(name);
  if (ext === 'pdf') {return 'pdf';}
  if (IMAGE_EXTENSIONS.includes(ext)) {return 'image';}
  if (CAD_EXTENSIONS.includes(ext)) {return 'cad';}
  return 'other';
};

/** A design is something to look at or to draw from: a PDF, an image or a CAD drawing. */
export const isDesignFileName = (name?: string | null): boolean => fileKind(name) !== 'other';

/** A plan document may also be an office document or a zip. */
export const isPlanFileName = (name?: string | null): boolean =>
  isDesignFileName(name) || DOCUMENT_EXTENSIONS.includes(fileExtension(name));

const acceptList = (extensions: string[]) => extensions.map((e) => `.${e}`).join(',');

/** For <input accept>. */
export const DESIGN_ACCEPT = acceptList(['pdf', ...IMAGE_EXTENSIONS, ...CAD_EXTENSIONS]);
export const PLAN_ACCEPT = acceptList(['pdf', ...IMAGE_EXTENSIONS, ...CAD_EXTENSIONS, ...DOCUMENT_EXTENSIONS]);

/** How the kinds are named to the user. */
export const DESIGN_KINDS_TEXT = 'PDF, images (JPG, PNG) or CAD drawings (DWG, DXF)';

/** Short name of a file's kind, for a link to it: "PDF", "Image", "DWG". */
export const fileKindLabel = (name?: string | null): string => {
  const kind = fileKind(name);
  if (kind === 'pdf') {return 'PDF';}
  if (kind === 'image') {return 'Image';}
  if (kind === 'cad') {return fileExtension(name).toUpperCase();}
  return 'File';
};

/** A browser shows PDFs and images itself; anything else is saved to the computer. */
export const opensInBrowser = (name?: string | null): boolean => {
  const kind = fileKind(name);
  return kind === 'pdf' || kind === 'image';
};

/** One file can be this large; the files of one upload can be this large together. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

interface Sized {
  name: string;
  size: number;
}

/** "840 KB", "3.2 MB". */
export const formatFileSize = (bytes?: number | null): string => {
  const b = bytes ?? 0;
  if (b < 1024) {return `${b} B`;}
  if (b < 1024 * 1024) {return `${Math.round(b / 1024)} KB`;}
  const mb = b / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
};

/**
 * Adds newly picked files to the ones already chosen. The same file picked twice is one file;
 * a file this upload does not take is left out and named in `refused`.
 */
export function addPickedFiles<T extends Sized>(
  current: T[],
  picked: T[],
  accepts: (name: string) => boolean,
): { files: T[]; refused: string[] } {
  const known = new Set(current.map((f) => `${f.name}:${f.size}`));
  const files = [...current];
  const refused: string[] = [];
  for (const f of picked) {
    const key = `${f.name}:${f.size}`;
    if (known.has(key)) {continue;}
    if (!accepts(f.name)) {
      refused.push(f.name);
      continue;
    }
    known.add(key);
    files.push(f);
  }
  return { files, refused };
}

/** Why these files cannot go up in one upload, or null when they can. */
export const uploadSizeProblem = (files: Sized[]): string | null => {
  const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) {return `${tooBig.name} is larger than 50 MB`;}
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return total > MAX_UPLOAD_BYTES ? `Together these files are ${formatFileSize(total)} — one upload can carry 200 MB` : null;
};
