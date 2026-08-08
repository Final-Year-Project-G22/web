"use client";

import { motion } from "framer-motion";

export function AnimatedMain({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-1 flex-col overflow-y-auto p-8 no-scrollbar"
    >
      {children}
    </motion.main>
  );
}
