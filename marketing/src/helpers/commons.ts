/** Base URL for the marketing site, always without a trailing slash (e.g. `/marketing`). */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Items for {@link combineClassNames}: `undefined` and `null` are dropped; only non-empty trimmed strings are kept. */
export type ClassNameArg = string | undefined | null;

/** Non-empty trimmed strings only; returns `undefined` if nothing remains. */
export function combineClassNames(parts: ClassNameArg[]): string | undefined {
  const joined = parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ');
  return joined || undefined;
}
