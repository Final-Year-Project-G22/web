"use client";

import { MotionConfig } from "framer-motion";
import type * as React from "react";

/**
 * App-wide reduced-motion gate for JS-driven (framer-motion) animation.
 *
 * The global CSS rule in globals.css already zeroes every CSS transition and
 * animation under prefers-reduced-motion; it cannot reach framer-motion's
 * JS-driven animations. `reducedMotion="user"` makes every child motion
 * component honor the user's OS setting instead: transform/layout animations
 * snap to their target and only opacity fades remain — a static or
 * cross-fade equivalent, per the design contract (§7).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
