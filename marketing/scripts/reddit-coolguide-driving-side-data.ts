/**
 * Driving-side traffic values for the r/coolguides world choropleth.
 * 1 = left-hand traffic, 2 = right-hand traffic, 0 = no vehicle traffic / N/A.
 *
 * Source: Wikipedia — Left- and right-hand traffic (accessed 2026).
 * Region labels must match the `title` attributes on worldRussiaSplit.svg paths.
 */

const LEFT_HAND_KEYS = new Set(
  [
    'anguilla',
    'antigua and barbuda',
    'australia',
    'bahamas',
    'bangladesh',
    'barbados',
    'bermuda',
    'bhutan',
    'botswana',
    'british virgin islands',
    'brunei',
    'brunei darussalam',
    'cayman islands',
    'christmas island',
    'cocos islands',
    'cocos keeling islands',
    'cook islands',
    'cyprus',
    'dominica',
    'east timor',
    'timor leste',
    'falkland islands',
    'fiji',
    'fiji east',
    'grenada',
    'guernsey',
    'guyana',
    'hong kong',
    'india',
    'indonesia',
    'ireland',
    'isle of man',
    'jamaica',
    'japan',
    'jersey',
    'kenya',
    'kiribati',
    'lesotho',
    'macau',
    'macao',
    'malawi',
    'malaysia',
    'maldives',
    'malta',
    'mauritius',
    'montserrat',
    'mozambique',
    'namibia',
    'nauru',
    'nepal',
    'new zealand',
    'niue',
    'pakistan',
    'papua new guinea',
    'pitcairn islands',
    'samoa',
    'seychelles',
    'singapore',
    'solomon islands',
    'south africa',
    'sri lanka',
    'saint helena',
    'st helena',
    'saint kitts and nevis',
    'st kitts and nevis',
    'saint lucia',
    'st lucia',
    'saint vincent and the grenadines',
    'st vincent and the grenadines',
    'suriname',
    'eswatini',
    'swaziland',
    'tanzania',
    'thailand',
    'tokelau',
    'tonga',
    'trinidad and tobago',
    'turks and caicos islands',
    'tuvalu',
    'uganda',
    'united kingdom',
    'uk',
    'us virgin islands',
    'united states virgin islands',
    'zambia',
    'zimbabwe',
    'channel islands',
    'gibraltar',
    'northern ireland',
    'south sudan',
    'saint vincent',
  ].map(normalizeKey),
);

const NO_TRAFFIC_KEYS = new Set(
  [
    'antarctica',
    'south georgia and the south sandwich islands',
    'heard island and mcdonald islands',
  ].map(normalizeKey),
);

export const DRIVING_SIDE_COLORS = {
  right: '#2C6BE5',
  left: '#E57C4A',
  neutral: '#B8BFC9',
} as const;

export const DRIVING_SIDE_LEGEND = {
  mapTitle: 'Which side of the road does each country drive on?',
  sourceLine: 'Source: Wikipedia · Left- and right-hand traffic (accessed 2026)',
  watermark: 'Made with Regionify · regionify.pro',
} as const;

export const OUTPUT = {
  width: 2160,
  height: 1350,
  filename: 'coolguide-driving-side.png',
} as const;

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function drivingSideValueForRegion(title: string): 0 | 1 | 2 {
  const key = normalizeKey(title);
  if (NO_TRAFFIC_KEYS.has(key)) return 0;
  if (LEFT_HAND_KEYS.has(key)) return 1;
  return 2;
}

export function buildDrivingSideCsv(regionTitles: string[]): string {
  const header = 'id,label,value';
  const rows = regionTitles.map((title) => {
    const value = drivingSideValueForRegion(title);
    if (value === 0) return null;
    return `${escapeCsv(title)},${escapeCsv(title)},${value}`;
  });
  return [header, ...rows.filter((row): row is string => row !== null)].join('\n');
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function countDrivingSides(regionTitles: string[]): {
  left: number;
  right: number;
  neutral: number;
} {
  let left = 0;
  let right = 0;
  let neutral = 0;
  for (const title of regionTitles) {
    const v = drivingSideValueForRegion(title);
    if (v === 1) left += 1;
    else if (v === 0) neutral += 1;
    else right += 1;
  }
  return { left, right, neutral };
}

export function drivingSideLegendLabels(counts: { left: number; right: number }): {
  rightLabel: string;
  leftLabel: string;
} {
  const rightWord = counts.right === 1 ? 'country' : 'countries';
  const leftWord = counts.left === 1 ? 'country' : 'countries and territories';
  return {
    rightLabel: `Drives on the RIGHT (${counts.right} ${rightWord})`,
    leftLabel: `Drives on the LEFT (${counts.left} ${leftWord})`,
  };
}
