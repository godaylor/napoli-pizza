import { useEffect, useRef } from 'react';

/** Animate navigation without remounting forms or changing fixed descendants. */
export function useRouteMotion<T extends HTMLElement>(pathname: string) {
  const ref = useRef<T>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    const element = ref.current;
    if (!element || !element.animate || !window.matchMedia) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || element.contains(document.activeElement)) return;

    // Opacity avoids creating a temporary containing block for sticky/fixed CTAs.
    const animation = element.animate(
      [{ opacity: 0.9 }, { opacity: 1 }],
      { duration: 180, easing: 'ease-out' },
    );
    const stop = () => animation.cancel();
    const onPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) stop();
    };

    element.addEventListener('focusin', stop);
    preference.addEventListener('change', onPreferenceChange);

    return () => {
      stop();
      element.removeEventListener('focusin', stop);
      preference.removeEventListener('change', onPreferenceChange);
    };
  }, [pathname]);

  return ref;
}
