/** Same roles as Ant Design `Button` `type`, plus full-width grid tile links. */
export type MarketingButtonType = 'primary' | 'secondary' | 'dashed' | 'default' | 'card';

const focusOutline =
  'transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const buttonBase = `inline-flex items-center gap-1 rounded-sm hover:transition-all ${focusOutline}`;

/** Single marketing control size (compact / sm). */
const buttonSizeDefault = 'px-4 py-1.5 text-sm justify-center';

/** Country grid and similar full-width tile links. */
const buttonSizeCard =
  'h-auto min-h-0 w-full justify-start px-4 py-3 text-sm font-normal shadow-sm';

export function buttonTypeClasses(
  visual: MarketingButtonType,
  colorScheme: 'light' | 'dark',
): string {
  if (visual === 'card') {
    return 'border border-gray-200 bg-white text-gray-800 hover:border-primary hover:bg-gray-50';
  }

  if (colorScheme === 'dark') {
    switch (visual) {
      case 'primary':
        return 'border-0 bg-white text-primary shadow-sm hover:opacity-90';
      case 'secondary':
        return 'border border-white bg-transparent text-white hover:bg-white/10';
      case 'dashed':
        return 'border border-dashed border-white/70 bg-transparent text-white hover:opacity-90';
      default:
        return 'border border-white/70 bg-transparent text-white hover:opacity-80';
    }
  }

  switch (visual) {
    case 'primary':
      return 'border-0 bg-primary text-white hover:opacity-90';
    case 'secondary':
      return 'border border-primary bg-white text-primary hover:bg-primary-50';
    case 'dashed':
      return 'border border-dashed border-gray-400 bg-transparent text-gray-800 hover:border-primary hover:text-primary';
    default:
      return 'border border-gray-300 bg-transparent text-gray-800 hover:border-primary hover:text-primary';
  }
}

/** Classes for `<button>` or button-styled `<a>`. */
export function composeButtonClasses(
  appearance: MarketingButtonType,
  colorScheme: 'light' | 'dark',
): string {
  const size = appearance === 'card' ? buttonSizeCard : buttonSizeDefault;
  return [buttonBase, size, buttonTypeClasses(appearance, colorScheme)].join(' ');
}
