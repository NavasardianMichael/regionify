import type { Locale } from '@regionify/shared';
import de from './de/common';
import en from './en/common';
import es from './es/common';
import fr from './fr/common';
import pt from './pt/common';
import ru from './ru/common';
import type { CommonNs } from './types';
import zh from './zh/common';

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
