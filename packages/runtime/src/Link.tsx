import type { CSSProperties, ElementType, KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useFrame } from './context';
import { goBack, goTo } from './navigation';

/** Interaction that triggers a link; shown on the board's arrows. */
export type Trigger = 'tap' | 'long-press' | 'swipe' | 'auto' | (string & {});

export type LinkTarget = {
  /** Screen id to open. */
  to?: string;
  /** Go to the logical parent instead (`meta.back`). */
  back?: boolean;
  /**
   * A real address instead of another screen: `#section-id` scrolls to a section of the same page, anything else
   * (`https://…`, `mailto:…`) leaves the mockup. Used by pages that are exported as a static site (`orbito export`).
   */
  href?: string;
  trigger?: Trigger;
};

/** Scrolls the element with this id into view inside the screen's own frame (the viewer owns the URL hash). */
const scrollToSection = (from: Element, id: string) => {
  const frame = from.closest('[data-pd-frame]') ?? document;
  const target = frame.querySelector(`#${CSS.escape(id)}`);

  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Props that make any element a prototype link. The board finds its arrows by reading `data-pd-to` / `data-pd-back`
 * from the rendered screens, so a link is declared exactly once: where it is drawn.
 * Design-system components accept a `LinkTarget` and spread these props on their root element; with `href` they
 * should render an `<a>` (the props then include `href`).
 */
export const useLinkProps = ({ to, back, href, trigger = 'tap' }: LinkTarget) => {
  const { mode } = useFrame();

  if (href) {
    // static export: a plain link, nothing else
    if (mode === 'export') return { href, 'data-pd-href': href };

    return {
      href,
      'data-pd-href': href,
      'data-pd-trigger': trigger,
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        if (mode !== 'screen') return;
        if (href.startsWith('#')) scrollToSection(e.currentTarget, href.slice(1));
        else window.open(href, '_blank', 'noopener');
      },
    };
  }
  if (!to && !back) return {};
  // a static page has no other screens to go to
  if (mode === 'export') return {};
  const go = () => {
    if (mode !== 'screen') return; // on the board and in the probe links are drawn, not followed
    if (back) goBack();
    else if (to) goTo(to);
  };

  return {
    'data-pd-to': to,
    'data-pd-back': back ? '' : undefined,
    'data-pd-trigger': trigger,
    onClick: (e: MouseEvent) => {
      e.preventDefault();
      go();
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    },
  };
};

type LinkProps = LinkTarget & {
  children?: ReactNode;
  /** Element to render (default `button`, or `a` with `href`). */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; also the arrow's label when the element has no text. */
  label?: string;
};

/** A bare prototype link. Prefer design-system components that take `to` / `back` / `href`. */
export const Link = ({ to, back, href, trigger, as, className, style, label, children }: LinkProps) => {
  const props = useLinkProps({ to, back, href, trigger });
  const As = as ?? (href ? 'a' : 'button');

  return (
    <As className={className} style={style} aria-label={label} type={As === 'button' ? 'button' : undefined} {...props}>
      {children}
    </As>
  );
};
