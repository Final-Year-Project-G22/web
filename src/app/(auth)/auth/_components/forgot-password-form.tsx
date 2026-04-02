"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordFormProps = {
  switchToLogin: () => void;
};

export function ForgotPasswordForm({ switchToLogin }: ForgotPasswordFormProps) {
  return (
    <div className="space-y-5 text-black">
      <h2 className="text-xl font-semibold">Forgot Password</h2>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input className="border-gray-400" type="email" placeholder="you@example.com" />
      </div>

      <Button className="w-full">Send Reset Link</Button>

      <p className="text-sm text-center">
        Back to{" "}
        <button
          type="button"
          onClick={switchToLogin}
          className="text-blue-600 cursor-pointer text-sm"
        >
          Login
        </button>
      </p>
    </div>
  );
}
