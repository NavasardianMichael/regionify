import { ErrorCode, HttpStatus } from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';
import { z } from 'zod';

import { env } from '@/config/env.js';
import { AppError } from '@/middleware/errorHandler.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requireChronographer } from '@/middleware/requireChronographer.js';
import { validate } from '@/middleware/validate.js';
import {
  MAX_AI_PARSE_INPUT_CHARS,
  getAiParseRemaining,
  streamAiParse,
} from '@/services/aiService.js';

const router: ExpressRouter = Router();

const aiParseSchema = z.object({
  text: z.string().min(1).max(MAX_AI_PARSE_INPUT_CHARS),
  mapRegionIds: z.array(z.string()).max(5000).default([]),
});

// POST /api/ai/parse — stream tab-delimited transformation via SSE
router.post(
  '/parse',
  requireAuth,
  requireChronographer,
  validate(aiParseSchema),
  async (req, res, next) => {
    if (!env.ANTHROPIC_API_KEY) {
      next(
        new AppError(
          HttpStatus.SERVICE_UNAVAILABLE,
          ErrorCode.INTERNAL_ERROR,
          'AI parser is not configured on this server.',
        ),
      );
      return;
    }

    const { text, mapRegionIds } = req.body as z.infer<typeof aiParseSchema>;
    const userId = req.session.userId!;

    // Set SSE headers before starting the stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const generator = streamAiParse(text, mapRegionIds, userId);

    // Abort the Anthropic stream if the client disconnects
    req.on('close', () => {
      void generator.return(undefined);
    });

    try {
      for await (const event of generator) {
        switch (event.type) {
          case 'remaining':
            res.write(`data: ${JSON.stringify({ meta: { remaining: event.count } })}\n\n`);
            break;
          case 'delta':
            res.write(`data: ${JSON.stringify({ delta: event.text })}\n\n`);
            break;
          case 'done':
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          case 'error':
            res.write(`data: ${JSON.stringify({ error: event.message })}\n\n`);
            res.end();
            return;
        }
      }
    } catch (error) {
      // Headers already sent — write an SSE error event instead of using next()
      const message =
        error instanceof AppError ? error.message : 'AI parsing failed. Please try again.';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  },
);

// GET /api/ai/remaining — remaining daily parse requests for the authenticated user
router.get('/remaining', requireAuth, requireChronographer, async (req, res, next) => {
  try {
    const remaining = await getAiParseRemaining(req.session.userId!);
    res.json({ success: true, data: { remaining } });
  } catch (error) {
    next(error);
  }
});

export const aiRoutes: ExpressRouter = router;
