import { useCallback } from 'react';
import { NavLink, type NavLinkProps } from 'react-router-dom';

type Props = NavLinkProps;

export const AppNavLink = ({ className, ...props }: Props) => {
  const computedClassName = useCallback(
    ({
      isActive,
      isPending,
      isTransitioning,
    }: {
      isActive: boolean;
      isPending: boolean;
      isTransitioning: boolean;
    }) => {
      const baseClass = 'text-primary';
      const customClass =
        typeof className === 'function'
          ? className({ isActive, isPending, isTransitioning })
          : className;

      return customClass ? `${baseClass} ${customClass}` : baseClass;
    },
    [className],
  );

  return <NavLink className={computedClassName} {...props} />;
};
