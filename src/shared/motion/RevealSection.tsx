import type { ComponentPropsWithoutRef } from 'react';

import { useRevealMotion } from './useRevealMotion';

export function RevealSection(props: ComponentPropsWithoutRef<'section'>) {
  const ref = useRevealMotion<HTMLElement>();
  return <section {...props} ref={ref} />;
}
