import { existsSync } from 'node:fs';
import type { Application, Request, Response } from 'express';
import express from 'express';

import { env, isProd } from '../config/env.js';
import { escapeHtml } from '../lib/htmlEscape.js';
import { logger } from '../lib/logger.js';
import { projectEmbedService } from '../services/projectEmbedService.js';
import { HOME_PAGE_DEFAULT } from './homeCopy.js';
import { readClientEntryAssets } from './readClientManifest.js';
import { renderHtmlDocument } from './renderHtmlDocument.js';
import { buildRobotsTxt, buildSitemapXml } from './sitemap.js';

/** Visible `<header>` intro; full copy remains in meta tags. */
const EMBED_VISIBLE_INTRO_MAX_CHARS = 360;

function visibleEmbedIntro(description: string): string {
  const t = description.trim().replace(/\s+/g, ' ');
  if (t.length <= EMBED_VISIBLE_INTRO_MAX_CHARS) return t;
  return `${t.slice(0, EMBED_VISIBLE_INTRO_MAX_CHARS - 1).trimEnd()}\u2026`;
}

const API_PATH_PREFIXES = [
  '/api',
  '/debug',
  '/health',
  '/auth',
  '/contact',
  '/payments',
  '/projects',
  '/sheets',
  '/embed-data',
] as const;

function isApiPath(path: string): boolean {
  return API_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function homeRootInnerHtml(): string {
  const { heading, welcome } = HOME_PAGE_DEFAULT;
  const h = escapeHtml(heading);
  const w = escapeHtml(welcome);
  return `
    <div class="flex h-full min-h-0 w-full flex-col items-center">
      <div class="flex w-full max-w-4xl flex-col gap-4 p-6">
        <h1 class="text-primary text-3xl font-bold">${h}</h1>
        <p class="text-gray-600">${w}</p>
      </div>
    </div>`;
}

/**
 * Serves the Vite client build and HTML shells for SEO-critical routes.
 */
export function setupWebClient(app: Application): void {
  const staticDir = env.CLIENT_STATIC_DIR;
  if (!staticDir || !existsSync(staticDir)) {
    if (staticDir && isProd) {
      throw new Error(
        `CLIENT_STATIC_DIR is set but path does not exist: ${staticDir}. ` +
          'Ensure client/dist is baked into the image or remove CLIENT_STATIC_DIR in production.',
      );
    }
    if (staticDir) {
      logger.warn(
        { staticDir },
        'CLIENT_STATIC_DIR set but path does not exist; skipping web static',
      );
    }
    return;
  }

  let assets: ReturnType<typeof readClientEntryAssets>;
  try {
    assets = readClientEntryAssets(staticDir);
  } catch (e) {
    if (isProd) {
      throw new Error(
        `Failed to read Vite client manifest under ${staticDir}. ` +
          'Rebuild the client with manifest enabled and include .vite/manifest.json in the image.',
        { cause: e },
      );
    }
    logger.error({ err: e }, 'Failed to read Vite client manifest; skipping web static');
    return;
  }

  const siteUrl = env.CLIENT_URL;

  app.get('/', (_req: Request, res: Response) => {
    const html = renderHtmlDocument({
      siteUrl,
      meta: {
        documentTitle: HOME_PAGE_DEFAULT.documentTitle,
        description: HOME_PAGE_DEFAULT.metaDescription,
        keywords: HOME_PAGE_DEFAULT.metaKeywords,
        canonicalPath: '/',
      },
      rootInnerHtml: homeRootInnerHtml(),
      entryJs: assets.js,
      entryCss: assets.css,
    });
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
  });

  app.get('/embed/:token', async (req: Request, res: Response, next) => {
    try {
      const rawToken = req.params.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
      const meta = await projectEmbedService.getEmbedMetaForHtml(token);
      const kw = meta.keywords;
      const html = renderHtmlDocument({
        siteUrl,
        meta: {
          documentTitle: meta.title,
          description: meta.description,
          keywords: kw,
          canonicalPath: `/embed/${encodeURIComponent(token)}`,
        },
        rootInnerHtml: '',
        entryJs: assets.js,
        entryCss: assets.css,
        htmlLang: meta.htmlLang,
        ogLocale: meta.ogLocale,
        includeEmbedJsonLd: true,
        embedSemantic: {
          heading: meta.title,
          intro: visibleEmbedIntro(meta.description),
        },
      });
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
    } catch (e) {
      next(e);
    }
  });

  app.get('/sitemap.xml', async (_req: Request, res: Response, next) => {
    try {
      const xml = await buildSitemapXml(siteUrl);
      res.status(200).setHeader('Content-Type', 'application/xml; charset=utf-8').send(xml);
    } catch (e) {
      next(e);
    }
  });

  app.get('/robots.txt', (_req: Request, res: Response) => {
    res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .send(buildRobotsTxt(siteUrl));
  });

  app.use(express.static(staticDir, { index: false, fallthrough: true }));

  app.get('*', (req: Request, res: Response, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    if (isApiPath(req.path)) {
      next();
      return;
    }

    const html = renderHtmlDocument({
      siteUrl,
      meta: {
        documentTitle: HOME_PAGE_DEFAULT.documentTitle,
        description: HOME_PAGE_DEFAULT.metaDescription,
        keywords: HOME_PAGE_DEFAULT.metaKeywords,
        canonicalPath: req.path || '/',
      },
      rootInnerHtml: '',
      entryJs: assets.js,
      entryCss: assets.css,
    });
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
  });
}
