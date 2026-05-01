"use client";

import { AuthModeProvider, useAuthMode } from "../_stores/auth-local.store";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

function AuthCardContent() {
  const mode = useAuthMode((state) => state.mode);

  return (
    <div className="w-full max-w-md">
      {mode === "login" && <LoginForm />}
      {mode === "register" && <RegisterForm />}
      {mode === "forgot" && <ForgotPasswordForm />}
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
