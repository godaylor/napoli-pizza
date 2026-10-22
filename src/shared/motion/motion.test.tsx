import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RevealSection } from './RevealSection';
import { useRouteMotion } from './useRouteMotion';

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
let intersect: IntersectionObserverCallback;
let reducedMotion: boolean;
let preferenceListeners: Set<(event: MediaQueryListEvent) => void>;
let cancel: ReturnType<typeof vi.fn>;
let animate: ReturnType<typeof vi.fn>;
let observe: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  reducedMotion = false;
  preferenceListeners = new Set();
  cancel = vi.fn();
  animate = vi.fn(() => ({ cancel }));
  observe = vi.fn();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, window.innerHeight + 24, 320, 200));
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return reducedMotion; },
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => preferenceListeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => preferenceListeners.delete(listener),
  }));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; }
    observe() { observe(); }
    disconnect() {}
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});

function reveal() {
  const section = screen.getByRole('region', { name: 'Pizza' });
  vi.mocked(HTMLElement.prototype.getBoundingClientRect)
    .mockReturnValue(new DOMRect(0, 24, 320, 200));
  const bounds = section.getBoundingClientRect();
  act(() => intersect(
    [{
      target: section,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: bounds,
      intersectionRect: bounds,
      rootBounds: null,
      time: 0,
    }],
    {} as IntersectionObserver,
  ));
}

function Section() {
  return <RevealSection aria-label="Pizza"><a href="#pizza">Choose pizza</a></RevealSection>;
}

function RouteContent({ pathname }: { pathname: string }) {
  const ref = useRouteMotion<HTMLElement>(pathname);
  return <main ref={ref}><label>Note<input defaultValue="" /></label></main>;
}

describe('progressive motion', () => {
  it('leaves an initially visible section still, even when only its top is on screen', () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect)
      .mockReturnValue(new DOMRect(0, window.innerHeight - 24, 320, 200));
    render(<Section />);
    expect(screen.getByRole('link', { name: 'Choose pizza' })).toBeVisible();
    expect(observe).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  it('leaves content visible and focusable when observer support is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Section />);
    const link = screen.getByRole('link', { name: 'Choose pizza' });
    link.focus();
    expect(link).toBeVisible();
    expect(link).toHaveFocus();
    expect(animate).not.toHaveBeenCalled();
  });

  it('does not animate for a reduced-motion preference', () => {
    reducedMotion = true;
    const { rerender } = render(<><Section /><RouteContent pathname="/menu" /></>);
    rerender(<><Section /><RouteContent pathname="/cart" /></>);
    expect(screen.getByRole('link', { name: 'Choose pizza' })).toBeVisible();
    expect(animate).not.toHaveBeenCalled();
  });

  it('reveals only once and immediately cancels motion for keyboard focus', () => {
    render(<Section />);
    reveal();
    expect(animate).toHaveBeenCalledTimes(1);
    screen.getByRole('link', { name: 'Choose pizza' }).focus();
    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Choose pizza' })).toHaveFocus();
    reveal();
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('cancels active reveal when reduced motion is enabled and cleans up its listener', () => {
    const { unmount } = render(<Section />);
    reveal();
    reducedMotion = true;
    act(() => preferenceListeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent)));
    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Choose pizza' })).toBeVisible();
    unmount();
    expect(preferenceListeners.size).toBe(0);
  });

  it('animates only path changes while preserving input state and the existing DOM', () => {
    const { rerender } = render(<RouteContent pathname="/menu" />);
    const note = screen.getByRole('textbox', { name: 'Note' });
    fireEvent.change(note, { target: { value: 'No onions' } });
    rerender(<RouteContent pathname="/menu" />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<RouteContent pathname="/cart" />);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note).toHaveValue('No onions');
    rerender(<RouteContent pathname="/cart" />);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
