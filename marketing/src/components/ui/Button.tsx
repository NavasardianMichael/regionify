import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { composeButtonClasses, type MarketingButtonType } from '@/components/ui/buttonAppearance';

export type { MarketingButtonType };

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'type'
> & {
  /**
   * Visual style (Ant Design `Button` `type`). `card` is for full-width tile links; prefer `<Link>`.
   * Use `htmlType` for the native `<button type="submit">`.
   */
  type?: MarketingButtonType;
  colorScheme?: 'light' | 'dark';
  children: ReactNode;
  htmlType?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

const disabled = 'disabled:pointer-events-none disabled:opacity-50';

export function Button(props: ButtonProps): React.JSX.Element {
  const {
    type: visual = 'default',
    colorScheme = 'light',
    children,
    htmlType = 'button',
    ...rest
  } = props;

  const classes = [composeButtonClasses(visual, colorScheme), disabled].filter(Boolean).join(' ');

  return (
    <button type={htmlType} className={classes} {...rest}>
      {children}
    </button>
  );
}
