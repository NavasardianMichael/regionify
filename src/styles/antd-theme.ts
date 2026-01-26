import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Primary color
    colorPrimary: '#18294D',

    // Border radius
    borderRadius: 6,

    // Font
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',

    // Spacing (matching Tailwind config)
    marginXS: 4,
    marginSM: 8,
    margin: 16,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,

    paddingXS: 4,
    paddingSM: 8,
    padding: 16,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,
  },
  components: {
    Button: {
      primaryShadow: 'none',
    },
    Layout: {
      headerBg: '#18294D',
      siderBg: '#18294D',
    },
  },
};
