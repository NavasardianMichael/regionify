import type { ReactNode } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import type {
  ArgsProps,
  JointContent,
  MessageInstance,
  MessageType,
} from 'antd/es/message/interface';

function nextKey(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function wrapContent(inner: ReactNode, destroy: () => void): ReactNode {
  return (
    <Flex align="center" justify="space-between" gap={12} className="min-w-0 flex-1">
      <span className="min-w-0 flex-1">{inner}</span>
      <Button
        type="text"
        size="small"
        icon={<CloseOutlined className="text-sm" />}
        aria-label="Close"
        className="shrink-0 text-gray-500 hover:text-gray-700!"
        onClick={destroy}
      />
    </Flex>
  );
}

/**
 * Wraps Ant Design {@link MessageInstance} so every notice includes a trailing close control.
 * The upstream hook hard-codes `closable: false`; this adds dismissal without forking antd.
 */
export function wrapMessageWithCloseButton(api: MessageInstance): MessageInstance {
  const wrapOpen = (config: ArgsProps): MessageType => {
    const key = config.key ?? nextKey();
    return api.open({
      ...config,
      key,
      content: wrapContent(config.content, () => {
        api.destroy(key);
      }),
    });
  };

  const makeTyped =
    (type: 'success' | 'error' | 'info' | 'warning' | 'loading') =>
    (
      jointContent: JointContent,
      duration?: number | VoidFunction,
      onClose?: VoidFunction,
    ): MessageType => {
      let config: ArgsProps;
      if (jointContent && typeof jointContent === 'object' && 'content' in jointContent) {
        config = jointContent as ArgsProps;
      } else {
        config = { content: jointContent as ReactNode };
      }
      let mergedDuration: number | undefined;
      let mergedOnClose: VoidFunction | undefined;
      if (typeof duration === 'function') {
        mergedOnClose = duration;
      } else {
        mergedDuration = duration;
        mergedOnClose = onClose;
      }
      const mergedConfig: ArgsProps = {
        onClose: mergedOnClose,
        duration: mergedDuration,
        ...config,
        type,
      };
      return wrapOpen(mergedConfig);
    };

  return {
    ...api,
    open: wrapOpen,
    success: makeTyped('success'),
    error: makeTyped('error'),
    info: makeTyped('info'),
    warning: makeTyped('warning'),
    loading: makeTyped('loading'),
  };
}
