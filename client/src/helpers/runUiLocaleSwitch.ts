import type { Locale } from '@regionify/shared';
import i18n from 'i18next';
import { useLanguageUiStore } from '@/store/languageUi/store';
import { loadAntdAppLocale, resolveAppLocale } from '@/helpers/antdAppLocale';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

type RunUiLocaleSwitchOptions = {
  /** When true, shows full-page overlay until i18n and Ant Design locale are ready. */
  showOverlay?: boolean;
};

/**
 * Switches i18next language and preloads the matching Ant Design locale (same chunks as AntdProvider).
 * Use from the language dropdown so UI stays coherent while locale chunks load.
 */
export async function runUiLocaleSwitch(
  locale: Locale,
  options: RunUiLocaleSwitchOptions = {},
): Promise<void> {
  const { showOverlay = true } = options;
  const setTransitioning = useLanguageUiStore.getState().setLanguageTransitioning;
  if (showOverlay) {
    setTransitioning(true);
  }
  try {
    await i18n.changeLanguage(locale);
    const code = resolveAppLocale(locale);
    await loadAntdAppLocale[code]();
    await nextFrame();
  } finally {
    if (showOverlay) {
      setTransitioning(false);
    }
  }
}
