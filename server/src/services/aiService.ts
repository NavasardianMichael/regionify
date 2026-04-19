import { GoogleGenAI } from '@google/genai';
import { ErrorCode, HttpStatus } from '@regionify/shared';

import { env, isDev } from '@/config/env.js';
import { redis } from '@/lib/redis.js';
import { AppError } from '@/middleware/errorHandler.js';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_AI_PARSE_REQUESTS_PER_DAY = 3;
export const MAX_AI_PARSE_INPUT_CHARS = 50_000;
export const AI_PARSE_MAX_TOKENS = 8192;

// Sentinel value surfaced to clients in dev to indicate the daily cap is disabled.
const UNLIMITED_REMAINING = 9999;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiStreamEvent =
  | { type: 'remaining'; count: number }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

// ─── Redis helpers ────────────────────────────────────────────────────────────

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function aiParseKey(userId: string): string {
  return `ai_parse:${userId}:${todayUtc()}`;
}

async function getAiParseCount(userId: string): Promise<number> {
  const val = await redis.get(aiParseKey(userId));
  return val ? Number(val) : 0;
}

async function incrementAiParseCount(userId: string): Promise<number> {
  const key = aiParseKey(userId);
  const count = await redis.incr(key);
  if (count === 1) {
    // First use today — set TTL so the key auto-expires after 24 h
    await redis.expire(key, 86400);
  }
  return count;
}

export async function getAiParseRemaining(userId: string): Promise<number> {
  if (isDev) return UNLIMITED_REMAINING;
  const count = await getAiParseCount(userId);
  return Math.max(0, MAX_AI_PARSE_REQUESTS_PER_DAY - count);
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(mapRegionIds: string[]): string {
  const regionBlock =
    mapRegionIds.length > 0
      ? `The target map has the following valid region IDs:\n<region_ids>\n${mapRegionIds.join('\n')}\n</region_ids>\n\n`
      : '';

  const idRule =
    mapRegionIds.length > 0
      ? '- id: MUST be one of the valid region IDs listed above. Match each data point to the closest valid region ID using the region name, code, or any other contextual hint. Omit rows you cannot confidently match.'
      : '- id: ISO region code (e.g. US-TX, DE, FR). Infer from region names when possible.';

  return `You are a data transformation tool. Convert the user's input into tab-delimited regional data.

${regionBlock}Output format (columns separated by a single tab character):
  Static data:   id<TAB>label<TAB>value
  Time-series:   id<TAB>label<TAB>value<TAB>time

Rules:
- Output ONLY the tab-delimited data. No explanations, no markdown, no code fences.
- First line is always the header row (id, label, value; add time only if data has a time dimension).
${idRule}
- label: human-readable region name as provided in the input (or inferred if not given).
- value: numeric (integer or decimal). Omit rows with no parseable numeric value.
- time: year or period label. Include only for time-series data.
- If the user provides generation instructions (e.g. "make up population data for EU countries") rather than raw data to transform, generate realistic plausible data following the same output format and rules above.`;
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export async function* streamAiParse(
  text: string,
  mapRegionIds: string[],
  userId: string,
): AsyncGenerator<AiStreamEvent> {
  if (isDev) {
    // Dev mode: skip the daily cap and Redis tracking entirely.
    yield { type: 'remaining', count: UNLIMITED_REMAINING };
  } else {
    const count = await incrementAiParseCount(userId);
    if (count > MAX_AI_PARSE_REQUESTS_PER_DAY) {
      throw new AppError(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.RATE_LIMITED,
        `Daily AI parse limit of ${MAX_AI_PARSE_REQUESTS_PER_DAY} requests reached. Resets in 24 hours.`,
      );
    }
    yield { type: 'remaining', count: MAX_AI_PARSE_REQUESTS_PER_DAY - count };
  }

  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.INTERNAL_ERROR,
      'AI parser is not configured on this server.',
    );
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const controller = new AbortController();

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text }] },
      // Model prefill: forces Gemini to continue with the correct header format
      { role: 'model', parts: [{ text: 'id\t' }] },
    ],
    config: {
      systemInstruction: buildSystemPrompt(mapRegionIds),
      temperature: 0,
      maxOutputTokens: AI_PARSE_MAX_TOKENS,
      stopSequences: ['\n\n\n'],
      thinkingConfig: { thinkingBudget: 0 },
      abortSignal: controller.signal,
    },
  });

  try {
    for await (const chunk of stream) {
      const delta = chunk.text;
      if (delta) {
        yield { type: 'delta', text: delta };
      }
    }
    yield { type: 'done' };
  } finally {
    // Ensure the underlying stream is cleaned up if the caller returns early
    controller.abort();
  }
}
