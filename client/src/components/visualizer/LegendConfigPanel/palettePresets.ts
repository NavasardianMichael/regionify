export type PaletteSuggestion = {
  id: string;
  name: string;
  colors: string[];
};

export type PaletteGroup = {
  id: string;
  titleKey:
    | 'visualizer.legendConfig.paletteGroups.smooth'
    | 'visualizer.legendConfig.paletteGroups.creative'
    | 'visualizer.legendConfig.paletteGroups.highContrast';
  suggestions: PaletteSuggestion[];
};

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: 'smooth',
    titleKey: 'visualizer.legendConfig.paletteGroups.smooth',
    suggestions: [
      {
        id: 'tailwind-blue',
        name: 'Blue',
        colors: ['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A8A'],
      },
      {
        id: 'tailwind-amber',
        name: 'Amber',
        colors: ['#FEF3C7', '#FCD34D', '#F59E0B', '#B45309', '#78350F'],
      },
      {
        id: 'tailwind-teal',
        name: 'Teal',
        colors: ['#CCFBF1', '#5EEAD4', '#14B8A6', '#0F766E', '#134E4A'],
      },
      {
        id: 'antd-lime',
        name: 'Lime',
        colors: ['#FCFFE6', '#D3F261', '#A0D911', '#5B8C00', '#254000'],
      },
      {
        id: 'tailwind-rose',
        name: 'Rose',
        colors: ['#FFE4E6', '#FDA4AF', '#F43F5E', '#BE123C', '#881337'],
      },
    ],
  },
  {
    id: 'creative',
    titleKey: 'visualizer.legendConfig.paletteGroups.creative',
    suggestions: [
      {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        colors: ['#00F5D4', '#00BBF9', '#9B5DE5', '#F15BB5', '#FEE440'],
      },
      {
        id: 'retro-pop',
        name: 'Retro Pop',
        colors: ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#8338EC'],
      },
      {
        id: 'cosmic',
        name: 'Cosmic',
        colors: ['#2B2D42', '#5A189A', '#9D4EDD', '#F72585', '#4CC9F0'],
      },
      {
        id: 'neon-pop',
        name: 'Neon Pop',
        colors: ['#00F5FF', '#00FF85', '#E9FF70', '#FF9E00', '#FF4D6D'],
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        colors: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#A855F7'],
      },
    ],
  },
  {
    id: 'high-contrast',
    titleKey: 'visualizer.legendConfig.paletteGroups.highContrast',
    suggestions: [
      {
        id: 'hc-danger',
        name: 'Danger Stripe',
        colors: ['#000000', '#FDE047', '#DC2626', '#2563EB', '#16A34A'],
      },
      {
        id: 'hc-vivid',
        name: 'Vivid',
        colors: ['#0038FF', '#FF005C', '#00C853', '#FF9800', '#6200EA'],
      },
      {
        id: 'hc-accessible',
        name: 'Accessible',
        colors: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#F0E442'],
      },
      {
        id: 'hc-dark-light',
        name: 'Dark / Light',
        colors: ['#111827', '#FFFFFF', '#B91C1C', '#1D4ED8', '#065F46'],
      },
      {
        id: 'hc-signal',
        name: 'Signal',
        colors: ['#B91C1C', '#F59E0B', '#15803D', '#2563EB', '#6D28D9'],
      },
    ],
  },
];

export function samplePaletteColor(palette: string[], index: number, total: number): string {
  if (palette.length === 0) return '#6B7280';
  if (total <= 1) return palette[palette.length - 1];
  const ratio = index / (total - 1);
  const paletteIndex = Math.round(ratio * (palette.length - 1));
  return palette[paletteIndex] ?? palette[palette.length - 1];
}

export const PALETTE_BY_ID = new Map<string, string[]>(
  PALETTE_GROUPS.flatMap((g) => g.suggestions.map((s) => [s.id, s.colors] as [string, string[]])),
);
