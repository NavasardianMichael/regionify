import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { composeButtonClasses, type MarketingButtonType } from '@/components/ui/buttonAppearance';

export type LinkTextVariant = 'default' | 'muted' | 'on-dark';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
  href: string;
  children: ReactNode;
  /** Inline text link. Ignored when `appearance` is set. */
  variant?: LinkTextVariant;
  /** Button-styled anchor; same variants as `<Button type={…}>`. */
  appearance?: MarketingButtonType;
  colorScheme?: 'light' | 'dark';
};

function textVariantClasses(variant: LinkTextVariant): string {
  switch (variant) {
    case 'muted':
      return 'inline text-sm text-gray-500 underline-offset-4 transition-colors hover:text-primary hover:underline';
    case 'on-dark':
      return 'inline text-sm font-medium text-white underline-offset-4 hover:underline';
    default:
      return 'inline text-sm font-medium text-primary underline-offset-4 hover:underline';
  }
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function Link(props: LinkProps): React.JSX.Element {
  const {
    href,
    variant: variantProp,
    appearance,
    colorScheme = 'light',
    children,
    ...rest
  } = props;

  const textVariant: LinkTextVariant = variantProp ?? 'default';

  const classes =
    appearance !== undefined
      ? composeButtonClasses(appearance, colorScheme)
      : [focusRing, textVariantClasses(textVariant)].join(' ');

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}
