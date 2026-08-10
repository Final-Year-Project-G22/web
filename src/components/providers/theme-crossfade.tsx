"use client";

import { useEffect, useState } from "react";

/**
 * ThemeCrossfade — softens the light↔dark flip with a brief monochrome wash.
 *
 * next-themes flips the `dark` class on <html> instantly (the app runs with
 * `disableTransitionOnChange`). A MutationObserver watches for real theme
 * changes; the initial mount is never observed — next-themes' head script
 * sets the class before hydration — so nothing fades on page load. On a
 * change, the overlay fades in the canvas colour (resolving to the theme
 * that just became active) and unmounts on animationend, reading as a quick
 * cross-fade. Reduced-motion users skip the overlay entirely via matchMedia;
 * the global prefers-reduced-motion CSS rule is the second layer.
 */
export function ThemeCrossfade() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let currentDark = root.classList.contains("dark");

    const observer = new MutationObserver(() => {
      if (reduceMotion.matches) return;
      const isDark = root.classList.contains("dark");
      if (isDark === currentDark) return;
      currentDark = isDark;
      setVisible(true);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Safety net: if the enter animation is cancelled or lost (tab throttling,
  // rapid toggling in the commit window), unmount the wash anyway so it can
  // never strand at full opacity.
  useEffect(() => {
    if (!visible) return;
    const safety = window.setTimeout(() => setVisible(false), 300);
    return () => window.clearTimeout(safety);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      onAnimationEnd={() => setVisible(false)}
      className="pointer-events-none fixed inset-0 z-[60] animate-in bg-canvas duration-200 fade-in-0"
    />
  );
}
