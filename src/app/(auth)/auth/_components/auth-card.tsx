"use client";

import { useState } from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  return (
    <div className="w-full max-w-md">
      {mode === "login" && (
        <LoginForm
          switchToRegister={() => setMode("register")}
          switchToForgot={() => setMode("forgot")}
        />
      )}

      {mode === "register" && <RegisterForm switchToLogin={() => setMode("login")} />}

      {mode === "forgot" && <ForgotPasswordForm switchToLogin={() => setMode("login")} />}
    </div>
  );
}
