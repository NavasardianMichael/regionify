import { getAlpha2Code } from 'i18n-iso-countries';
import { REGION_OPTIONS } from '@/constants/regions';

const REGION_LABEL_BY_VALUE = new Map(
  REGION_OPTIONS.map((o) => [String(o.value), String(o.label)]),
);

/** Alpha-2 overrides when English map label does not match i18n-iso-countries names. */
const ISO2_BY_REGION_ID: Partial<Record<string, string>> = {
  congoDR: 'CD',
  czechRepublic: 'CZ',
  ivoryCoast: 'CI',
  eastTimor: 'TL',
  kosovo: 'XK',
  usaMercator: 'US',
};

/** UN M.49 area codes for continent-style maps (Intl `DisplayNames` with type `region`). */
const UN_M49_BY_REGION_ID: Partial<Record<string, string>> = {
  africa: '002',
  asia: '142',
  europe: '150',
  caribbean: '029',
  centralAmerica: '013',
  southAmerica: '005',
  australiaOceania: '053',
  latinAmerica: '419',
  middleEast: '145',
  world: '001',
  worldAntarctica: '001',
  worldIndia: '001',
  worldPacificRim: '001',
  worldRussiaSplit: '001',
  continentsRegions: '001',
  continentsRussiaAntarctica: '001',
};

const APP_LOCALE_TO_INTL: Record<string, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  ru: 'ru',
  zh: 'zh-CN',
  pt: 'pt-BR',
  de: 'de',
};

/** Human-readable region label in English (same as the region picker). */
export function getRegionDisplayName(countryId: string | null | undefined): string | null {
  if (!countryId) return null;
  return REGION_LABEL_BY_VALUE.get(countryId) ?? null;
}

/**
 * Localized region / area name for the current UI language using `Intl.DisplayNames`.
 * Falls back to the English picker label when no CLDR code can be resolved.
 */
export function getLocalizedRegionLabel(
  regionId: string | null | undefined,
  appLocale: string,
): string | null {
  if (!regionId) return null;
  const english = getRegionDisplayName(regionId);
  if (!english) {
    return regionId.replace(/([A-Z])/g, ' $1').trim();
  }

  const code =
    ISO2_BY_REGION_ID[regionId] ??
    UN_M49_BY_REGION_ID[regionId] ??
    getAlpha2Code(english, 'en') ??
    undefined;

  if (!code) {
    return english;
  }

  const intlLocale = APP_LOCALE_TO_INTL[appLocale] ?? appLocale;
  try {
    const dn = new Intl.DisplayNames([intlLocale, 'en'], { type: 'region' });
    return dn.of(code) ?? english;
  } catch {
    return english;
  }
}
