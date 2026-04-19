import { type FC, useCallback, useMemo, useState } from 'react';
import { Flex, Modal as AntModal, type ModalProps } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import modalBodyScrollbarStyles from '@/components/shared/modalBodyScrollbar.module.css';
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

const FULLSCREEN_WRAPPER_CLASS =
  '[&_.ant-modal]:w-[calc(100vw-24px)]! [&_.ant-modal]:max-w-none! [&_.ant-modal]:top-0! [&_.ant-modal]:p-0!';
const FULLSCREEN_CONTAINER_CLASS =
  'w-[calc(100vw-24px)]! max-w-none! h-[calc(100vh-24px)]! max-h-none! flex! flex-col!';
const FULLSCREEN_BODY_CLASS = 'flex-1! min-h-0! overflow-y-auto!';
const FULLSCREEN_BODY_FILL_CLASS = 'flex! flex-1! min-h-0! flex-col! overflow-hidden!';
/** Fixed height so `flex-1` on the body resolves; `max-h` alone leaves `height: auto` and collapses the body. */
const FILL_BODY_CONTAINER_CLASS =
  'flex! h-[min(70vh,calc(100vh-2rem))]! max-h-[1000px]! min-w-0! flex-col! overflow-hidden!';
const FILL_BODY_BODY_CLASS = 'flex! min-h-0! min-w-0! flex-1! flex-col! overflow-hidden!';

const mergeClass = (...parts: Array<string | undefined>): string | undefined => {
  const filtered = parts.filter((p): p is string => Boolean(p));
  return filtered.length > 0 ? filtered.join(' ') : undefined;
};

export const AppExpandableModal: FC<AppExpandableModalProps> = ({
  fullscreenToggle = false,
  fillBody = false,
  centered = true,
  maskClosable = false,
  destroyOnHidden,
  destroyOnClose,
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
  const effectiveDestroyOnHidden = destroyOnHidden ?? destroyOnClose ?? true;

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
        ? mergeClass(FULLSCREEN_BODY_FILL_CLASS, base?.body)
        : mergeClass(base?.body, FULLSCREEN_BODY_CLASS);
      return {
        ...base,
        wrapper: mergeClass(base?.wrapper, FULLSCREEN_WRAPPER_CLASS),
        container: mergeClass(base?.container, FULLSCREEN_CONTAINER_CLASS),
        body: fullscreenBodyClass,
      };
    }

    if (!fillBody) return classNames;

    return {
      ...base,
      container: mergeClass(base?.container, FILL_BODY_CONTAINER_CLASS),
      body: mergeClass(base?.body, FILL_BODY_BODY_CLASS),
    };
  }, [classNames, fillBody, isFullscreen]);

  const rootClassName = [modalBodyScrollbarStyles.bodyScrollbar, className]
    .filter(Boolean)
    .join(' ');

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
