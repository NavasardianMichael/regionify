import { type FC, type PropsWithChildren, useMemo } from 'react';
import { App } from 'antd';
import { wrapMessageWithCloseButton } from '@/helpers/wrapMessageWithCloseButton';
import { FeedbackContext } from '@/components/shared/feedbackContext';

/**
 * Provides {@link App.useApp} APIs with message notices that include an inline close control.
 * Must be used as a descendant of antd {@link App}.
 */
export const FeedbackProvider: FC<PropsWithChildren> = ({ children }) => {
  const app = App.useApp();
  const value = useMemo(
    () => ({
      ...app,
      message: wrapMessageWithCloseButton(app.message),
    }),
    [app],
  );
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
};
