"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AuthModeProvider, useAuthMode } from "../_stores/auth-local.store";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";

function AuthCardContent() {
  const mode = useAuthMode((state) => state.mode);
  const reduceMotion = useReducedMotion();

  const swapTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeInOut" as const };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {mode === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={swapTransition}
          >
            <LoginForm />
          </motion.div>
        )}
        {mode === "forgot" && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={swapTransition}
          >
            <ForgotPasswordForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AuthCard() {
  return (
    <AuthModeProvider>
      <AuthCardContent />
    </AuthModeProvider>
  );
}
