/**
 * Pure utility functions — no DOM, no side effects, fully testable.
 */

/**
 * Converts a Google Drive share URL to a direct image URL via lh3.googleusercontent.com.
 * Any URL that doesn't match the Drive pattern is returned as-is.
 */
export function driveUrl(raw) {
  const m = raw.match(/\/file\/d\/([^/?]+)/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : raw;
}

/**
 * Resolves a photo source to its final URL.
 * - HTTP/HTTPS URLs go through driveUrl (converts Drive share links).
 * - Bare filenames are resolved relative to the pet's imagenes/ folder.
 */
export function resolvePhoto(src, petName) {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return driveUrl(src);
  }
  return `mascotas/${petName}/imagenes/${src}`;
}

/**
 * Converts *word* markers in a title string to <em>word</em> HTML.
 * Unmatched asterisks are left unchanged.
 */
export function renderTitle(raw) {
  return raw.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
