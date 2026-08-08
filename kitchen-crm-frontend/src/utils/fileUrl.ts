/** Uploaded files are served from the API host, not the SPA origin. */
export const fileUrl = (path?: string) => {
  if (!path) return '#';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta as any).env?.VITE_API_BASE_URL || '';
  return `${String(base).replace(/\/api\/v1\/?$/, '')}${path}`;
};
