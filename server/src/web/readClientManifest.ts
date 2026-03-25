import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type ManifestEntry = {
  file: string;
  css?: string[];
  imports?: string[];
};

export type ClientEntryAssets = {
  js: string;
  css: string[];
};

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
  return {
    js: `/${entry.file}`,
    css: css.map((c) => `/${c}`),
  };
}
