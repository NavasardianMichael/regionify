import { type FC, useEffect } from 'react';
import { DEFAULT_LOCALE } from '@regionify/shared';
import i18n from 'i18next';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { getStoredLocale } from '@/helpers/localeStorage';

/** Syncs i18n language from user.locale or localStorage (guests). Run once when app mounts. */
export const LocaleSync: FC = () => {
  const user = useProfileStore(selectUser);

  useEffect(() => {
    const locale = user?.locale ?? getStoredLocale() ?? DEFAULT_LOCALE;
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [user?.locale]);

  return null;
};
