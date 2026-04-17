import { createContext } from 'react';
import { type App } from 'antd';

export type AppFeedback = ReturnType<typeof App.useApp>;

export const FeedbackContext = createContext<AppFeedback | null>(null);
