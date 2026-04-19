import { type FC, useCallback, useMemo, useState } from 'react';
import { Flex, Modal as AntModal, type ModalProps } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { combineClassNames } from '@/helpers/common';
import {
  FILL_BODY_BODY_CLASS,
  FILL_BODY_CONTAINER_CLASS,
  FULLSCREEN_BODY_CLASS,
  FULLSCREEN_BODY_FILL_CLASS,
  FULLSCREEN_CONTAINER_CLASS,
  FULLSCREEN_WRAPPER_CLASS,
} from './constants';
import { FullscreenToggleButton } from './FullscreenToggleButton';

/** Forwards antd `Modal`; `destroyOnHidden` defaults to true in the implementation. */
export type AppExpandableModalProps = ModalProps & {
  /** When true, shows a dashed fullscreen toggle in the header after the title. */
  fullscreenToggle?: boolean;
  /**
   * Flex column on the modal shell: container gets a viewport-capped height so the body can
   * use `flex-1 min-h-0`; children should use `flex-1 min-h-0` on the scrollable block.
   */
  fillBody?: boolean;
};

export const AppExpandableModal: FC<AppExpandableModalProps> = ({
  fullscreenToggle = false,
  fillBody = false,
  centered = true,
  maskClosable = false,
  destroyOnHidden,
  className,
  classNames,
  width,
  title,
  onCancel,
  children,
  ...rest
}) => {
  const { t } = useTypedTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const effectiveDestroyOnHidden = destroyOnHidden ?? true;

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleCancel = useCallback<NonNullable<ModalProps['onCancel']>>(
    (e) => {
      setIsFullscreen(false);
      onCancel?.(e);
    },
    [onCancel],
  );

  const mergedTitle = useMemo(() => {
    if (!fullscreenToggle) return title;

    const hasTitle = title !== undefined && title !== null && title !== false;
    return (
      <Flex align="center" gap="small" className="min-w-0">
        {hasTitle ? <div className="min-w-0 flex-1 [&_.ant-typography]:mb-0!">{title}</div> : null}
        <div className="shrink-0">
          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            enterLabel={t('common.modalFullscreenEnter')}
            exitLabel={t('common.modalFullscreenExit')}
            onToggle={handleToggleFullscreen}
          />
        </div>
      </Flex>
    );
  }, [fullscreenToggle, title, isFullscreen, t, handleToggleFullscreen]);

  const composedClassNames = useMemo<ModalProps['classNames']>(() => {
    if (typeof classNames === 'function') return classNames;

    const base = classNames;

    if (isFullscreen) {
      const fullscreenBodyClass = fillBody
        ? combineClassNames([FULLSCREEN_BODY_FILL_CLASS, base?.body])
        : combineClassNames([base?.body, FULLSCREEN_BODY_CLASS]);
      return {
        ...base,
        wrapper: combineClassNames([base?.wrapper, FULLSCREEN_WRAPPER_CLASS]),
        container: combineClassNames([base?.container, FULLSCREEN_CONTAINER_CLASS]),
        body: fullscreenBodyClass,
      };
    }

    if (!fillBody) return classNames;

    return {
      ...base,
      container: combineClassNames([base?.container, FILL_BODY_CONTAINER_CLASS]),
      body: combineClassNames([base?.body, FILL_BODY_BODY_CLASS]),
    };
  }, [classNames, fillBody, isFullscreen]);

  const rootClassName = combineClassNames(['scrollbar-modal-host', className]);

  return (
    <AntModal
      {...rest}
      title={mergedTitle}
      onCancel={handleCancel}
      centered={centered}
      maskClosable={maskClosable}
      destroyOnHidden={effectiveDestroyOnHidden}
      className={rootClassName}
      classNames={composedClassNames}
      width={isFullscreen ? undefined : width}
    >
      {children}
    </AntModal>
  );
};
