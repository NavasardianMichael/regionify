import type { FC, PropsWithChildren } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import { FeedbackProvider } from '@/components/antd/FeedbackProvider';
import { theme } from '@/styles/antd-theme';

const ANT_APP_MESSAGE_PROPS = {
  duration: 5,
  top: 24,
};

export const AntdProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ConfigProvider theme={theme}>
      <AntApp message={ANT_APP_MESSAGE_PROPS}>
        <FeedbackProvider>{children}</FeedbackProvider>
      </AntApp>
    </ConfigProvider>
  );
};
