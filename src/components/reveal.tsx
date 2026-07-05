'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

export type RevealAnimation = 'up' | 'scale' | 'start' | 'fade';

interface UseRevealOptions {
  animation?: RevealAnimation;
  delay?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * IntersectionObserver-powered scroll reveal hook.
 * Returns props to spread onto ANY element.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  animation = 'up',
  delay = 0,
  once = true,
  threshold = 0.12,
}: UseRevealOptions = {}) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  const baseClass = animation === 'fade' ? 'reveal' : `reveal r-${animation}`;

  return {
    ref,
    className: `${baseClass} ${visible ? 'is-visible' : ''}`,
    style: { transitionDelay: `${delay}ms` } as CSSProperties,
  };
}

interface RevealProps {
  children: ReactNode;
  animation?: RevealAnimation;
  delay?: number;
  once?: boolean;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Convenience wrapper that renders a div with scroll-reveal.
 * For grid/flex children that must stay direct elements, use the
 * `useReveal` hook directly on the element instead.
 */
export default function Reveal({
  children,
  animation = 'up',
  delay = 0,
  once = true,
  threshold = 0.12,
  className = '',
  style,
}: RevealProps) {
  const reveal = useReveal<HTMLDivElement>({ animation, delay, once, threshold });

  return (
    <div
      ref={reveal.ref}
      className={`${reveal.className} ${className}`}
      style={{ ...reveal.style, ...style }}
    >
      {children}
    </div>
  );
}
