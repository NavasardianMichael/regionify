/**
 * Generates a random alphanumeric ID of specified length
 * @param length - The length of the ID to generate (default: 8)
 * @returns A random alphanumeric string
 */
export const generateRandomId = (length = 8): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** Shorten a long URL for inline display; use `title={url}` for the full string. */
export function truncateUrlForDisplay(url: string, maxChars = 56): string {
  if (url.length <= maxChars) return url;
  const inner = maxChars - 3;
  const head = Math.ceil(inner / 2);
  const tail = Math.floor(inner / 2);
  return `${url.slice(0, head)}…${url.slice(-tail)}`;
}
