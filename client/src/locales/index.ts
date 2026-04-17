import type { Locale } from '@regionify/shared';
import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import pt from './pt';
import ru from './ru';
import type { CommonNs } from './types';
import zh from './zh';

export type { CommonNs } from './types';

const resources: Record<Locale, { common: CommonNs }> = {
  en: { common: en },
  es: { common: es },
  fr: { common: fr },
  ru: { common: ru },
  zh: { common: zh },
  pt: { common: pt },
  de: { common: de },
};

export { resources };
