import { useEffect, useRef } from 'react';

/** Content is visible by default; motion is a one-time enhancement on entry. */
export function useRevealMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !element.animate || !window.matchMedia || !window.IntersectionObserver) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;

    // Content already on screen should paint immediately, including a section
    // that is only partly visible at the bottom of the initial viewport.
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    let animation: Animation | undefined;
    let revealed = false;
    const observer = new IntersectionObserver((entries) => {
      if (revealed || !entries.some((entry) => entry.target === element && entry.isIntersecting)) return;
      revealed = true;
      observer.disconnect();

      // Keyboard users should never wait for a focused control to settle.
      if (preference.matches || element.contains(document.activeElement)) return;
      animation = element.animate(
        [{ transform: 'translateY(12px)' }, { transform: 'translateY(0)' }],
        { duration: 320, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      );
    }, { rootMargin: '0px 0px -24px 0px', threshold: 0 });

    const stop = () => {
      revealed = true;
      observer.disconnect();
      animation?.cancel();
    };
    const onPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) stop();
    };

    observer.observe(element);
    element.addEventListener('focusin', stop);
    preference.addEventListener('change', onPreferenceChange);

    return () => {
      stop();
      element.removeEventListener('focusin', stop);
      preference.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  return ref;
}
