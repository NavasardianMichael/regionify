import type { ProjectDataset } from '@/api/projects/types';
import type { GoogleSheetSource } from '@/store/mapData/types';

/** Legacy flat keys on stored JSON before `dataset.google` existed. */
type LegacyDatasetFields = {
  googleSheetsUrl?: string;
  googleSheetsGid?: string | null;
};

/**
 * Reads Google Sheets source from a project dataset (nested `google` or legacy flat fields).
 */
export function readGoogleFromDataset(
  dataset: ProjectDataset | null | undefined,
): GoogleSheetSource {
  if (!dataset) {
    return { url: null, gid: null };
  }

  if (dataset.google?.url) {
    return {
      url: dataset.google.url,
      gid: dataset.google.gid ?? null,
    };
  }

  const legacy = dataset as ProjectDataset & LegacyDatasetFields;
  if (legacy.googleSheetsUrl) {
    return {
      url: legacy.googleSheetsUrl,
      gid: legacy.googleSheetsGid ?? null,
    };
  }

  return { url: null, gid: null };
}
