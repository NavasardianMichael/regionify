import { type LocaleData, registerLocale } from 'i18n-iso-countries';
import de from 'i18n-iso-countries/langs/de.json';
import en from 'i18n-iso-countries/langs/en.json';
import es from 'i18n-iso-countries/langs/es.json';
import fr from 'i18n-iso-countries/langs/fr.json';
import pt from 'i18n-iso-countries/langs/pt.json';
import ru from 'i18n-iso-countries/langs/ru.json';
import zh from 'i18n-iso-countries/langs/zh.json';

/** Browser builds must register locales before `getAlpha2Code` / `getName` work (en is required for lookups). */
const LOCALES: LocaleData[] = [
  en as LocaleData,
  de as LocaleData,
  es as LocaleData,
  fr as LocaleData,
  pt as LocaleData,
  ru as LocaleData,
  zh as LocaleData,
];

for (const locale of LOCALES) {
  registerLocale(locale);
}
