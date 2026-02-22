import { type FC, useCallback, useMemo } from 'react';
import type { Locale } from '@regionify/shared';
import { Flex, Select, type SelectProps } from 'antd';
import deFlag from '@/assets/images/flags/de.svg';
import enFlag from '@/assets/images/flags/en.svg';
import esFlag from '@/assets/images/flags/es.svg';
import frFlag from '@/assets/images/flags/fr.svg';
import ptFlag from '@/assets/images/flags/pt.svg';
import ruFlag from '@/assets/images/flags/ru.svg';
import zhFlag from '@/assets/images/flags/zh.svg';
import { updateProfile } from '@/api/auth';
import { selectSetUser, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { LOCALE_OPTIONS } from '@/constants/locales';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { setStoredLocale } from '@/helpers/localeStorage';

const FLAG_SRC: Record<Locale, string> = {
  en: enFlag,
  es: esFlag,
  fr: frFlag,
  ru: ruFlag,
  zh: zhFlag,
  pt: ptFlag,
  de: deFlag,
};

type Props = Omit<SelectProps<Locale>, 'value' | 'onChange' | 'options' | 'role'> & {
  /** Current locale from i18n (e.g. after changeLanguage). */
  currentLocale: Locale;
};

export const LanguageDropdown: FC<Props> = ({ currentLocale, ...selectProps }) => {
  const { i18n } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const setUser = useProfileStore(selectSetUser);

  const handleLocaleChange = useCallback(
    async (locale: Locale) => {
      await i18n.changeLanguage(locale);
      if (user) {
        try {
          const { user: updated } = await updateProfile({ locale });
          setUser(updated);
        } catch {
          // Keep UI in new language; persist failed
        }
      } else {
        setStoredLocale(locale);
      }
    },
    [i18n, user, setUser],
  );

  const options = useMemo(
    () =>
      LOCALE_OPTIONS.map(({ code, label }) => ({
        value: code,
        label: (
          <Flex align="center" gap="small">
            <img
              src={FLAG_SRC[code]}
              alt=""
              className="h-4 w-6 rounded-sm object-cover"
              width={24}
              height={16}
            />
            <span>{label}</span>
          </Flex>
        ),
      })),
    [],
  );

  return (
    <Select<Locale>
      value={currentLocale}
      role="combobox"
      onChange={handleLocaleChange}
      options={options}
      // className={
      //   variant === 'borderless'
      //     ? '[&_.ant-select-selector]:border-none! [&_.ant-select-selector]:bg-transparent! [&_.ant-select-selector]:shadow-none!'
      //     : ''
      // }
      className="w-32"
      {...selectProps}
    />
  );
};
