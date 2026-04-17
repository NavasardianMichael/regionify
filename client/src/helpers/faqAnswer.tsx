import type { ReactNode } from 'react';

const EMPHASIS_SEGMENT = /(\*\*[^*]+\*\*)/g;

/**
 * Renders FAQ answer strings where translators wrap real keywords in **double asterisks**
 * (product terms, formats, plan names). Those spans get `font-semibold`.
 */
export function renderFaqAnswer(answer: string): ReactNode {
  return answer.split(EMPHASIS_SEGMENT).map((segment, index) => {
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
