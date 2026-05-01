"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

type ForgotPasswordFormProps = {
  switchToLogin: () => void;
};

export function ForgotPasswordForm({ switchToLogin }: ForgotPasswordFormProps) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotFormData) => {
    setLoading(true);
    setSent(true);
    setTimeout(() => {
      router.push("/auth");
    }, 5000);
  };

  if (sent) {
    return (
      <div className="space-y-5 text-black">
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded">
          <p className="font-medium mb-1">Check your email</p>
          <p className="text-sm">
            We&apos;ve sent password reset instructions to <b>{form.getValues("email")}</b>.
            Redirecting to login…
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => router.push("/auth")}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-black">
      <h2 className="text-xl font-semibold">Forgot Password</h2>
      <p className="text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            className="border-gray-400"
            id="email"
            type="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-sm text-center">
        Back to{" "}
        <button type="button" onClick={switchToLogin} className="text-blue-600 hover:underline">
          Login
        </button>
      </p>
    </div>
  );
}
