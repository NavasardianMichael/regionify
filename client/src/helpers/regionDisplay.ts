import type { DefaultOptionType } from 'antd/es/select';
import { getAlpha2Code, getName, getSimpleAlpha2Code } from 'i18n-iso-countries';
import { REGION_OPTIONS } from '@/constants/regions';

import './registerIsoCountriesLocales';

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

const SUPPORTED_ISO_COUNTRIES_LANGS = new Set(['en', 'de', 'es', 'fr', 'ru', 'zh', 'pt']);

function toIsoCountriesLang(appLocale: string): string {
  const base = appLocale.split('-')[0]?.toLowerCase() ?? 'en';
  return SUPPORTED_ISO_COUNTRIES_LANGS.has(base) ? base : 'en';
}

function isUnM49AreaCode(code: string): boolean {
  return /^\d{3}$/.test(code);
}

function displayNameForRegionCode(
  code: string,
  appLocale: string,
  englishFallback: string,
): string {
  const intlLocale = APP_LOCALE_TO_INTL[appLocale] ?? appLocale;
  try {
    const dn = new Intl.DisplayNames([intlLocale, 'en'], { type: 'region' });
    const name = dn.of(code);
    // Some engines return the UN M.49 code (e.g. "002") instead of "Africa" — use app label.
    if (!name || name === code) {
      return englishFallback;
    }
    return name;
  } catch {
    return englishFallback;
  }
}

/** Human-readable region label in English (same as the region picker). */
export function getRegionDisplayName(countryId: string | null | undefined): string | null {
  if (!countryId) return null;
  return REGION_LABEL_BY_VALUE.get(countryId) ?? null;
}

function resolveAlpha2OrAreaCode(regionId: string, english: string): string | undefined {
  const fromId = ISO2_BY_REGION_ID[regionId] ?? UN_M49_BY_REGION_ID[regionId];
  if (fromId) return fromId;
  return getAlpha2Code(english, 'en') ?? getSimpleAlpha2Code(english, 'en') ?? undefined;
}

/**
 * Localized region / area name: ISO countries via i18n-iso-countries (`getName`),
 * UN M.49 areas via `Intl.DisplayNames`. Requires `registerIsoCountriesLocales` (side effect import).
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

  const code = resolveAlpha2OrAreaCode(regionId, english);
  if (!code) {
    return english;
  }

  if (isUnM49AreaCode(code)) {
    return displayNameForRegionCode(code, appLocale, english);
  }

  const lang = toIsoCountriesLang(appLocale);
  const localized = getName(code, lang) ?? getName(code, 'en');
  if (localized) {
    return localized;
  }

  return displayNameForRegionCode(code, appLocale, english);
}

/** Ant Design Select options with `label` translated for the current UI locale (values unchanged). */
export function getLocalizedRegionSelectOptions(appLocale: string): DefaultOptionType[] {
  return REGION_OPTIONS.map((o) => ({
    ...o,
    label: getLocalizedRegionLabel(String(o.value), appLocale) ?? String(o.label),
  }));
}
