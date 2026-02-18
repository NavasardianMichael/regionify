import { useState } from 'react';
import { Button } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { ROUTES } from '@/constants/routes';
import { useProfileStore } from '@/store/profile/store';

export const TestImports = () => {
  const [count, setCount] = useState(0);
  const { t } = useTypedTranslation();
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
};
