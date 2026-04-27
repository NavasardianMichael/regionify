import type { ReactNode } from 'react';

type MarketingTitleProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  colorScheme?: 'light' | 'dark';
  className?: string;
  children: ReactNode;
};

const commonClasses = 'text-balance';

const levelClasses: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: 'text-3xl font-bold md:text-4xl',
  2: 'text-2xl font-bold md:text-3xl',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
  6: 'text-sm font-semibold',
};

const colorSchemeClasses: Record<'light' | 'dark', string> = {
  light: 'text-primary',
  dark: 'text-white',
};

export function MarketingTitle({
  level = 2,
  colorScheme = 'light',
  className,
  children,
}: MarketingTitleProps): React.JSX.Element {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const classes = [commonClasses, levelClasses[level], colorSchemeClasses[colorScheme], className]
    .filter(Boolean)
    .join(' ');
  return <Tag className={classes}>{children}</Tag>;
}
