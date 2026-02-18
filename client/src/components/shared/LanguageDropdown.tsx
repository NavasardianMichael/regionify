import { type FC, useCallback } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import type { Locale } from '@regionify/shared';
import { Dropdown, Flex } from 'antd';
import arFlag from '@/assets/images/flags/ar.svg';
import enFlag from '@/assets/images/flags/en.svg';
import esFlag from '@/assets/images/flags/es.svg';
import frFlag from '@/assets/images/flags/fr.svg';
import ruFlag from '@/assets/images/flags/ru.svg';
import zhFlag from '@/assets/images/flags/zh.svg';
import { updateProfile } from '@/api/auth';
import { selectSetUser, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { LOCALE_OPTIONS } from '@/constants/locales';
import { setStoredLocale } from '@/helpers/localeStorage';

import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const FLAG_SRC: Record<Locale, string> = {
  en: enFlag,
  es: esFlag,
  fr: frFlag,
  ru: ruFlag,
  ar: arFlag,
  zh: zhFlag,
};

type Props = {
  /** Current locale from i18n (e.g. after changeLanguage). */
  currentLocale: string;
};

export const LanguageDropdown: FC<Props> = ({ currentLocale }) => {
  const { t, i18n } = useTypedTranslation();
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

  const menuItems = LOCALE_OPTIONS.map(({ code, label }) => ({
    key: code,
    label: (
      <Flex align="center" gap="small">
        <img
          src={FLAG_SRC[code]}
          alt=""
          className="h-4 w-6 rounded object-cover"
          width={24}
          height={16}
        />
        <span>{label}</span>
      </Flex>
    ),
    onClick: () => handleLocaleChange(code),
  }));

  const currentFlag =
    (currentLocale in FLAG_SRC ? FLAG_SRC[currentLocale as Locale] : null) ?? null;

  return (
    <Dropdown
      menu={{ items: menuItems, selectedKeys: [currentLocale] }}
      trigger={['click']}
      placement="bottomRight"
    >
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100"
        title={t('common.language')}
        aria-label={t('common.language')}
      >
        {currentFlag ? (
          <img
            src={currentFlag}
            alt=""
            className="h-4 w-6 rounded object-cover"
            width={24}
            height={16}
          />
        ) : (
          <GlobalOutlined className="text-lg" />
        )}
      </button>
    </Dropdown>
  );
};
