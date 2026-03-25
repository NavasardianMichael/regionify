import type { NextFunction, Request, Response } from 'express';

/**
 * Allow any origin to read public embed JSON (no credentials). Safe for public map payloads.
 */
export function embedDataCors(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
}
