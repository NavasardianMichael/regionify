import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FC, PropsWithChildren } from 'react';

import {
  composeButtonClasses,
  type MarketingButtonType,
} from '@/components/ui/MarketingButton/appearance';
import { combineClassNames } from '@/helpers/commons';

export type { MarketingButtonType };

type BaseProps = {
  /** Visual style. Use `link` for inline text anchors; other types render as button-styled elements. */
  type?: MarketingButtonType;
  colorScheme?: 'light' | 'dark';
  /** Renders muted gray variant; only applies when `type="link"`. */
  muted?: boolean;
};

type AsAnchor = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    htmlType?: never;
  };

type AsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    href?: never;
    htmlType?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  };

export type MarketingButtonProps = AsAnchor | AsButton;

const disabledClasses = 'disabled:pointer-events-none disabled:opacity-50';

export const MarketingButton: FC<PropsWithChildren<MarketingButtonProps>> = (props) => {
  const { type: visual = 'default', colorScheme = 'light', muted = false, children } = props;
  const internalClassNames = composeButtonClasses(visual, colorScheme, muted);

  if ('href' in props && props.href != null) {
    const {
      type: _t,
      colorScheme: _cs,
      muted: _m,
      children: _ch,
      htmlType: _ht,
      ...anchorProps
    } = props as AsAnchor;
    return (
      <a
        className={combineClassNames([internalClassNames, anchorProps.className])}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  const {
    type: _t,
    colorScheme: _cs,
    muted: _m,
    children: _ch,
    href: _href,
    htmlType = 'button',
    ...buttonProps
  } = props as AsButton;
  return (
    <button
      type={htmlType}
      className={combineClassNames([internalClassNames, disabledClasses, buttonProps.className])}
      {...buttonProps}
    >
      {children}
    </button>
  );
};
