import type { CountryRow } from '@/data/parseCountries';

export type MarketingCountry = Pick<CountryRow, 'slug'> & { name: CountryRow['name_en'] };

export const MARKETING_COUNTRIES: MarketingCountry[] = [
  { slug: 'armenia', name: 'Armenia' },
  { slug: 'russia', name: 'Russian Federation' },
  { slug: 'germany', name: 'Germany' },
  { slug: 'brazil', name: 'Brazil' },
  { slug: 'india', name: 'India' },
];
