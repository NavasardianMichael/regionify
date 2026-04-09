import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type ManifestEntry = {
  file: string;
  css?: string[];
  imports?: string[];
};

/** Vite manifest key for the standalone embed shell stylesheet (see client `vite.config` `rollupOptions.input`). */
const EMBED_SHELL_MANIFEST_KEY = 'src/embed/embed-shell.css';

export type ClientEntryAssets = {
  js: string;
  css: string[];
  /** Hashed `/assets/*.css` for SSR `/embed/:token` only — not linked on home / SPA shell. */
  embedShellCss: string;
};

/** Root-absolute path (`/assets/...`) so nested routes (e.g. `/embed/:token`) never resolve under the path prefix. */
function rootAssetPath(file: string): string {
  const t = file.trim().replace(/^\/+/, '');
  return `/${t}`;
}

/**
 * Reads Vite client manifest (`build.manifest: true`) to resolve hashed entry JS/CSS.
 */
export function readClientEntryAssets(clientDistDir: string): ClientEntryAssets {
  const manifestPath = join(clientDistDir, '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `Vite client manifest missing at ${manifestPath}. Build the client with manifest enabled.`,
    );
  }

  const raw = readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw) as Record<string, ManifestEntry>;

  const entry = manifest['index.html'];
  if (!entry?.file) {
    throw new Error('Vite manifest has no index.html entry');
  }

  const css = entry.css ?? [];
  const shellEntry = manifest[EMBED_SHELL_MANIFEST_KEY];
  if (!shellEntry?.file) {
    throw new Error(
      `Vite manifest has no ${EMBED_SHELL_MANIFEST_KEY} entry; ensure client build includes embedShell input.`,
    );
  }

  return {
    js: rootAssetPath(entry.file),
    css: css.map((c) => rootAssetPath(c)),
    embedShellCss: rootAssetPath(shellEntry.file),
  };
}
