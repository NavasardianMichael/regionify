/** Items for {@link combineClassNames}: `undefined` and `null` are dropped; only non-empty trimmed strings are kept. */
export type ClassNameArg = string | undefined | null;

/** Non-empty trimmed strings only; returns `undefined` if nothing remains. */
export function combineClassNames(parts: ClassNameArg[]): string | undefined {
  const joined = parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ');
  return joined || undefined;
}

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
