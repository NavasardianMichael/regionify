import { AI_ENDPOINTS } from './endpoints';
import type { AiParsePayload, AiRemainingResponse } from './types';

type SseErrorPayload = { error: string };
type SseDeltaPayload = { delta: string };
type SseMetaPayload = { meta: { remaining: number } };

/**
 * Streams an AI parse request via Server-Sent Events.
 * Calls `onDelta` for each text chunk and `onRemaining` once with the updated
 * daily request count received from the server.
 */
export const streamAiParse = async (
  payload: AiParsePayload,
  onDelta: (text: string) => void,
  onRemaining: (count: number) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch(AI_ENDPOINTS.parse, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: { message?: string } };
    throw new Error(data.error?.message ?? 'AI parsing failed. Please try again.');
  }

  if (!response.body) {
    throw new Error('No response stream received.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are delimited by double newlines
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();

        if (raw === '[DONE]') return;

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue;
        }

        if (typeof parsed !== 'object' || parsed === null) continue;

        if ('error' in parsed) {
          throw new Error((parsed as SseErrorPayload).error);
        }
        if ('delta' in parsed) {
          onDelta((parsed as SseDeltaPayload).delta);
        }
        if ('meta' in parsed) {
          onRemaining((parsed as SseMetaPayload).meta.remaining);
        }
      }
    }
  }
};

/**
 * Fetches the remaining daily AI parse request count for the authenticated user.
 */
export const fetchAiRemaining = async (): Promise<number> => {
  const response = await fetch(AI_ENDPOINTS.remaining, {
    credentials: 'include',
  });
  const data = (await response.json()) as AiRemainingResponse;
  if (!response.ok || !data.success) {
    return 0;
  }
  return data.data.remaining;
};
