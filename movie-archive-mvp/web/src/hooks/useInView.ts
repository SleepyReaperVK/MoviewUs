import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Extra margin around the viewport to trigger earlier (e.g. "200px") */
  rootMargin?: string;
  /** Fraction of element visible before triggering (0–1) */
  threshold?: number;
  /** If true, stays visible once intersected (default: true) */
  once?: boolean;
}

/**
 * Custom hook that uses the Intersection Observer API to detect
 * when an element scrolls into the viewport.
 *
 * Returns a ref to attach to the target element and a boolean
 * indicating whether it's currently (or has been) in view.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const { rootMargin = "200px", threshold = 0, once = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}
