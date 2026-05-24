"use client";

import { AnimatePresence, motion } from "framer-motion";

import { AuthModeProvider, useAuthMode } from "../_stores/auth-local.store";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";

function AuthCardContent() {
  const mode = useAuthMode((state) => state.mode);

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {mode === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <LoginForm />
          </motion.div>
        )}
        {mode === "forgot" && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
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
