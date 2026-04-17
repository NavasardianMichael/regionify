import type { ThemeConfig } from 'antd';
import { MANUAL_ENTRY_TABLE_FONT_PX } from '@/constants/manualDataEntryModal';

export const tableTheme: ThemeConfig = {
  components: {
    Table: {
      headerBg: '#ffffff',
      headerSortActiveBg: '#ffffff',
      headerSortHoverBg: '#ffffff',
      headerFilterHoverBg: '#ffffff',
      fixedHeaderSortActiveBg: '#ffffff',
      bodySortBg: '#ffffff',
      rowHoverBg: '#ffffff',
      rowSelectedBg: '#ffffff',
      rowSelectedHoverBg: '#ffffff',
      rowExpandedBg: '#ffffff',
      footerBg: '#ffffff',
      cellFontSize: MANUAL_ENTRY_TABLE_FONT_PX,
      cellFontSizeMD: MANUAL_ENTRY_TABLE_FONT_PX,
      cellFontSizeSM: MANUAL_ENTRY_TABLE_FONT_PX,
    },
    Input: {
      inputFontSize: MANUAL_ENTRY_TABLE_FONT_PX,
      inputFontSizeSM: MANUAL_ENTRY_TABLE_FONT_PX,
      inputFontSizeLG: MANUAL_ENTRY_TABLE_FONT_PX,
    },
    InputNumber: {
      inputFontSize: MANUAL_ENTRY_TABLE_FONT_PX,
      inputFontSizeSM: MANUAL_ENTRY_TABLE_FONT_PX,
      inputFontSizeLG: MANUAL_ENTRY_TABLE_FONT_PX,
    },
  },
};
