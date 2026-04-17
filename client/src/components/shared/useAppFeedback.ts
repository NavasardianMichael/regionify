import { useContext } from 'react';
import { type AppFeedback, FeedbackContext } from '@/components/shared/feedbackContext';

export function useAppFeedback(): AppFeedback {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useAppFeedback must be used within FeedbackProvider (inside antd App).');
  }
  return ctx;
}

export type MessageApi = AppFeedback['message'];
