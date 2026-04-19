export const FULLSCREEN_WRAPPER_CLASS =
  '[&_.ant-modal]:w-[calc(100vw-24px)]! [&_.ant-modal]:max-w-none! [&_.ant-modal]:top-0! [&_.ant-modal]:p-0!';

export const FULLSCREEN_CONTAINER_CLASS =
  'w-[calc(100vw-24px)]! max-w-none! h-[calc(100vh-24px)]! max-h-none! flex! flex-col!';

export const FULLSCREEN_BODY_CLASS = 'flex-1! min-h-0! overflow-y-auto!';

export const FULLSCREEN_BODY_FILL_CLASS = 'flex! flex-1! min-h-0! flex-col! overflow-hidden!';

/** Fixed height so `flex-1` on the body resolves; `max-h` alone leaves `height: auto` and collapses the body. */
export const FILL_BODY_CONTAINER_CLASS =
  'flex! h-[min(70vh,calc(100vh-2rem))]! max-h-[1000px]! min-w-0! flex-col! overflow-hidden!';

export const FILL_BODY_BODY_CLASS = 'flex! min-h-0! min-w-0! flex-1! flex-col! overflow-hidden!';
