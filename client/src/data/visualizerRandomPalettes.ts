import { hexToRgba } from '@/helpers/hexToRgba';

/** Internal-only full-scene themes for “random palette” (not shown in UI). */
export type VisualizerRandomPalette = {
  rangeColors: string[];
  map: {
    border: {
      show: boolean;
      color: string;
      width: number;
    };
    shadow: {
      show: boolean;
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
    picture: {
      transparentBackground: boolean;
      backgroundColor: string;
    };
    regionLabels: {
      show: boolean;
      color: string;
      fontSize: number;
    };
  };
  legend: {
    labels: { color: string; fontSize: number };
    /** Omitted or false: use opaque legend background */
    transparentBackground?: boolean;
    backgroundColor: string;
    noDataColor: string;
  };
};

const nordicSurface = '#F4F6F8';
const editorialSurface = '#FAF7F2';
const brutalSurface = '#FFFFFF';

export const VISUALIZER_RANDOM_PALETTES: VisualizerRandomPalette[] = [
  {
    rangeColors: ['#E2E8F0', '#94A3B8', '#64748B', '#475569', '#334155', '#1E293B'],
    map: {
      border: { show: true, color: '#CBD5E1', width: 1 },
      shadow: { show: false, color: '#000000', blur: 8, offsetX: 0, offsetY: 2 },
      picture: { transparentBackground: false, backgroundColor: nordicSurface },
      regionLabels: { show: true, color: '#1E293B', fontSize: 10 },
    },
    legend: {
      labels: { color: '#0F172A', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFFFF', 0.94),
      noDataColor: '#E2E8F0',
    },
  },
  {
    rangeColors: ['#EDE4D9', '#C4B5A0', '#8B7355', '#5C4D3C', '#3D3229'],
    map: {
      border: { show: true, color: '#D4C4B0', width: 1 },
      shadow: { show: true, color: 'rgba(44, 44, 44, 0.06)', blur: 14, offsetX: 0, offsetY: 4 },
      picture: { transparentBackground: false, backgroundColor: editorialSurface },
      regionLabels: { show: true, color: '#2C2C2C', fontSize: 10 },
    },
    legend: {
      labels: { color: '#1A1A1A', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFEF9', 0.92),
      noDataColor: '#E8DFD4',
    },
  },
  {
    rangeColors: ['#F5F5F5', '#D4D4D4', '#737373', '#404040', '#171717'],
    map: {
      border: { show: true, color: '#000000', width: 2.5 },
      shadow: { show: false, color: '#000000', blur: 0, offsetX: 0, offsetY: 0 },
      picture: { transparentBackground: false, backgroundColor: brutalSurface },
      regionLabels: { show: true, color: '#000000', fontSize: 11 },
    },
    legend: {
      labels: { color: '#000000', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFFFF', 0.98),
      noDataColor: '#E5E5E5',
    },
  },
  {
    rangeColors: ['#EDE9FE', '#C4B5FD', '#8B5CF6', '#6D28D9', '#4C1D95'],
    map: {
      border: { show: true, color: '#DDD6FE', width: 1 },
      shadow: { show: true, color: 'rgba(109, 40, 217, 0.12)', blur: 20, offsetX: 0, offsetY: 6 },
      picture: { transparentBackground: false, backgroundColor: '#F5F3FF' },
      regionLabels: { show: true, color: '#4C1D95', fontSize: 10 },
    },
    legend: {
      labels: { color: '#3B0764', fontSize: 12 },
      backgroundColor: hexToRgba('#FAF5FF', 0.95),
      noDataColor: '#EDE9FE',
    },
  },
  {
    rangeColors: ['#CFFAFE', '#67E8F9', '#22D3EE', '#0891B2', '#155E75', '#164E63'],
    map: {
      border: { show: true, color: '#A5F3FC', width: 1 },
      shadow: { show: true, color: 'rgba(8, 145, 178, 0.15)', blur: 16, offsetX: 0, offsetY: 5 },
      picture: { transparentBackground: false, backgroundColor: '#ECFEFF' },
      regionLabels: { show: true, color: '#164E63', fontSize: 10 },
    },
    legend: {
      labels: { color: '#0C4A6E', fontSize: 12 },
      backgroundColor: hexToRgba('#F0FDFF', 0.94),
      noDataColor: '#CFFAFE',
    },
  },
  {
    rangeColors: ['#D1FAE5', '#6EE7B7', '#34D399', '#059669', '#047857', '#064E3B'],
    map: {
      border: { show: true, color: '#A7F3D0', width: 1 },
      shadow: { show: true, color: 'rgba(5, 150, 105, 0.12)', blur: 18, offsetX: 0, offsetY: 5 },
      picture: { transparentBackground: false, backgroundColor: '#F0FDF4' },
      regionLabels: { show: true, color: '#14532D', fontSize: 10 },
    },
    legend: {
      labels: { color: '#064E3B', fontSize: 12 },
      backgroundColor: hexToRgba('#F7FEF9', 0.93),
      noDataColor: '#D1FAE5',
    },
  },
  {
    rangeColors: ['#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937'],
    map: {
      border: { show: true, color: '#9CA3AF', width: 1 },
      shadow: { show: false, color: '#000000', blur: 10, offsetX: 0, offsetY: 4 },
      picture: { transparentBackground: false, backgroundColor: '#F9FAFB' },
      regionLabels: { show: true, color: '#374151', fontSize: 10 },
    },
    legend: {
      labels: { color: '#111827', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFFFF', 0.96),
      noDataColor: '#E5E7EB',
    },
  },
  {
    rangeColors: ['#FED7AA', '#FB923C', '#EA580C', '#C2410C', '#9A3412', '#7C2D12'],
    map: {
      border: { show: true, color: '#FDBA74', width: 1 },
      shadow: { show: true, color: 'rgba(194, 65, 12, 0.14)', blur: 16, offsetX: 0, offsetY: 5 },
      picture: { transparentBackground: false, backgroundColor: '#FFF7ED' },
      regionLabels: { show: true, color: '#7C2D12', fontSize: 10 },
    },
    legend: {
      labels: { color: '#431407', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFBF5', 0.94),
      noDataColor: '#FFEDD5',
    },
  },
  {
    rangeColors: ['#00F5D4', '#00BBF9', '#9B5DE5', '#F15BB5', '#FEE440'],
    map: {
      border: { show: true, color: '#312E81', width: 1 },
      shadow: { show: true, color: 'rgba(0, 245, 212, 0.35)', blur: 24, offsetX: 0, offsetY: 8 },
      picture: { transparentBackground: false, backgroundColor: '#0F0A1E' },
      regionLabels: { show: true, color: '#E0E7FF', fontSize: 10 },
    },
    legend: {
      labels: { color: '#F5F3FF', fontSize: 12 },
      backgroundColor: hexToRgba('#1E1B4B', 0.92),
      noDataColor: '#312E81',
    },
  },
  {
    rangeColors: ['#FF006E', '#8338EC', '#3A86FF', '#FFBE0B', '#FB5607'],
    map: {
      border: { show: true, color: '#DB2777', width: 1 },
      shadow: { show: true, color: 'rgba(255, 0, 110, 0.4)', blur: 28, offsetX: 0, offsetY: 10 },
      picture: { transparentBackground: false, backgroundColor: '#1A0A2E' },
      regionLabels: { show: true, color: '#FBCFE8', fontSize: 10 },
    },
    legend: {
      labels: { color: '#FCE7F3', fontSize: 12 },
      backgroundColor: hexToRgba('#2D1B4E', 0.9),
      noDataColor: '#4C1D95',
    },
  },
  {
    rangeColors: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#F0E442', '#56B4E9'],
    map: {
      border: { show: true, color: '#1F2937', width: 1.5 },
      shadow: { show: false, color: '#000000', blur: 8, offsetX: 0, offsetY: 2 },
      picture: { transparentBackground: false, backgroundColor: '#FFFFFF' },
      regionLabels: { show: true, color: '#111827', fontSize: 11 },
    },
    legend: {
      labels: { color: '#111827', fontSize: 12 },
      backgroundColor: hexToRgba('#F9FAFB', 0.97),
      noDataColor: '#E5E7EB',
    },
  },
  {
    rangeColors: ['#BFDBFE', '#60A5FA', '#2563EB', '#1E40AF', '#1E3A8A'],
    map: {
      border: { show: true, color: '#93C5FD', width: 1 },
      shadow: { show: false, color: '#000000', blur: 10, offsetX: 0, offsetY: 4 },
      picture: { transparentBackground: false, backgroundColor: '#EFF6FF' },
      regionLabels: { show: true, color: '#1E3A8A', fontSize: 10 },
    },
    legend: {
      labels: { color: '#1E3A8A', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFFFF', 0.95),
      noDataColor: '#DBEAFE',
    },
  },
  {
    rangeColors: ['#FECDD3', '#FB7185', '#E11D48', '#BE123C', '#881337'],
    map: {
      border: { show: true, color: '#FDA4AF', width: 1 },
      shadow: { show: true, color: 'rgba(225, 29, 72, 0.1)', blur: 16, offsetX: 0, offsetY: 5 },
      picture: { transparentBackground: false, backgroundColor: '#FFF1F2' },
      regionLabels: { show: true, color: '#881337', fontSize: 10 },
    },
    legend: {
      labels: { color: '#4C0519', fontSize: 12 },
      backgroundColor: hexToRgba('#FFF5F7', 0.94),
      noDataColor: '#FFE4E6',
    },
  },
  {
    rangeColors: ['#D8F3DC', '#95D5B2', '#52B788', '#2D6A4F', '#1B4332'],
    map: {
      border: { show: true, color: '#B7E4C7', width: 1 },
      shadow: { show: true, color: 'rgba(45, 106, 79, 0.12)', blur: 14, offsetX: 0, offsetY: 4 },
      picture: { transparentBackground: false, backgroundColor: '#F1FAF4' },
      regionLabels: { show: true, color: '#1B4332', fontSize: 10 },
    },
    legend: {
      labels: { color: '#0D2818', fontSize: 12 },
      backgroundColor: hexToRgba('#F7FCF9', 0.93),
      noDataColor: '#D8F3DC',
    },
  },
  {
    rangeColors: ['#FEF08A', '#FACC15', '#EAB308', '#CA8A04', '#A16207'],
    map: {
      border: { show: true, color: '#FDE047', width: 1 },
      shadow: { show: true, color: 'rgba(202, 138, 4, 0.18)', blur: 18, offsetX: 0, offsetY: 6 },
      picture: { transparentBackground: false, backgroundColor: '#FEFCE8' },
      regionLabels: { show: true, color: '#713F12', fontSize: 10 },
    },
    legend: {
      labels: { color: '#422006', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFBEB', 0.94),
      noDataColor: '#FEF9C3',
    },
  },
  {
    rangeColors: ['#C4B5FD', '#A78BFA', '#7C3AED', '#5B21B6', '#4C1D95'],
    map: {
      border: { show: true, color: '#A78BFA', width: 1 },
      shadow: { show: true, color: 'rgba(124, 58, 237, 0.2)', blur: 22, offsetX: 0, offsetY: 7 },
      picture: { transparentBackground: false, backgroundColor: '#FAF5FF' },
      regionLabels: { show: true, color: '#4C1D95', fontSize: 10 },
    },
    legend: {
      labels: { color: '#3B0764', fontSize: 12 },
      backgroundColor: hexToRgba('#F5F3FF', 0.95),
      noDataColor: '#EDE9FE',
    },
  },
  {
    rangeColors: ['#0C1821', '#1B2A41', '#324A5F', '#CCC9DC', '#E6E8E6'],
    map: {
      border: { show: true, color: '#324A5F', width: 1 },
      shadow: { show: true, color: 'rgba(204, 201, 220, 0.15)', blur: 20, offsetX: 0, offsetY: 6 },
      picture: { transparentBackground: false, backgroundColor: '#0C1821' },
      regionLabels: { show: true, color: '#E6E8E6', fontSize: 10 },
    },
    legend: {
      labels: { color: '#CCC9DC', fontSize: 12 },
      backgroundColor: hexToRgba('#1B2A41', 0.94),
      noDataColor: '#324A5F',
    },
  },
  {
    rangeColors: ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'],
    map: {
      border: { show: true, color: '#118AB2', width: 1.5 },
      shadow: { show: true, color: 'rgba(17, 138, 178, 0.2)', blur: 20, offsetX: 0, offsetY: 6 },
      picture: { transparentBackground: false, backgroundColor: '#F8FAFC' },
      regionLabels: { show: true, color: '#073B4C', fontSize: 10 },
    },
    legend: {
      labels: { color: '#0F172A', fontSize: 12 },
      backgroundColor: hexToRgba('#FFFFFF', 0.95),
      noDataColor: '#E2E8F0',
    },
  },
  {
    rangeColors: ['#F0ABFC', '#E879F9', '#C026D3', '#A21CAF', '#86198F'],
    map: {
      border: { show: true, color: '#F0ABFC', width: 1 },
      shadow: { show: true, color: 'rgba(192, 38, 211, 0.15)', blur: 22, offsetX: 0, offsetY: 7 },
      picture: { transparentBackground: false, backgroundColor: '#FDF4FF' },
      regionLabels: { show: true, color: '#701A75', fontSize: 10 },
    },
    legend: {
      labels: { color: '#4A044E', fontSize: 12 },
      backgroundColor: hexToRgba('#FAF5FF', 0.94),
      noDataColor: '#FAE8FF',
    },
  },
];

export function pickRandomVisualizerPalette(): VisualizerRandomPalette {
  const i = Math.floor(Math.random() * VISUALIZER_RANDOM_PALETTES.length);
  return VISUALIZER_RANDOM_PALETTES[i]!;
}
