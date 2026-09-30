import type { ReactNode } from 'react';

const EMPHASIS_SEGMENT = /(\*\*[^*]+\*\*)/g;

/**
 * Renders strings where translators wrap key phrases in **double asterisks**
 * (product terms, formats, plan names, instructions). Those spans get `font-semibold`.
 */
export function renderEmphasisText(text: string): ReactNode {
  return text.split(EMPHASIS_SEGMENT).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**') && segment.length >= 4) {
      return (
        <span key={index} className="font-semibold">
          {segment.slice(2, -2)}
        </span>
      );
    }
    return segment;
  });
}
