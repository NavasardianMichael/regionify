import { type FC, useCallback, useMemo } from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { Locale } from '@regionify/shared';
import { Button, Dropdown, type DropdownProps, Flex, type MenuProps, Typography } from 'antd';
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
import { runUiLocaleSwitch } from '@/helpers/runUiLocaleSwitch';

const FLAG_SRC: Record<Locale, string> = {
  en: enFlag,
  es: esFlag,
  fr: frFlag,
  ru: ruFlag,
  zh: zhFlag,
  pt: ptFlag,
  de: deFlag,
};

type Props = {
  currentLocale: Locale;
  placement?: DropdownProps['placement'];
  /** Extra classes for the trigger button (e.g. form full width). */
  className?: string;
};

export const LanguageDropdown: FC<Props> = ({ currentLocale, placement, className = '' }) => {
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const setUser = useProfileStore(selectSetUser);

  const handleLocaleChange = useCallback(
    async (locale: Locale) => {
      await runUiLocaleSwitch(locale, { showOverlay: true });
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
    [user, setUser],
  );

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      LOCALE_OPTIONS.map(({ code, label }) => ({
        key: code,
        label: (
          <Flex align="center" gap="small">
            <img
              src={FLAG_SRC[code]}
              alt=""
              className="h-4 w-6 rounded-sm object-cover"
              width={24}
              height={16}
            />
            <Typography.Text>{label}</Typography.Text>
          </Flex>
        ),
      })),
    [],
  );

  const onMenuClick = useCallback(
    (info: { key: string }) => {
      void handleLocaleChange(info.key as Locale);
    },
    [handleLocaleChange],
  );

  const currentLabel = LOCALE_OPTIONS.find((o) => o.code === currentLocale)?.label ?? currentLocale;

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: onMenuClick }}
      trigger={['click']}
      placement={placement ?? 'bottomRight'}
    >
      <Button
        type="text"
        aria-label={t('nav.languageSelectAriaLabel')}
        aria-haspopup="menu"
        className={`flex! items-center gap-2 px-2! py-1! ${className}`}
      >
        <img
          src={FLAG_SRC[currentLocale]}
          alt=""
          className="h-4 w-6 shrink-0 rounded-sm object-cover"
          width={24}
          height={16}
        />
        <Typography.Text className="min-w-0 truncate text-sm font-medium text-gray-700">
          {currentLabel}
        </Typography.Text>
        <DownOutlined className="shrink-0 text-[10px] text-gray-400" aria-hidden />
      </Button>
    </Dropdown>
  );
};
