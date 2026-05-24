"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthMode } from "../_stores/auth-local.store";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const setMode = useAuthMode((state) => state.setMode);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = () => {
    setSent(true);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto space-y-6"
      >
        <div className="rounded-xl bg-success/10 border border-success/20 p-6 text-center space-y-3">
          <div className="mx-auto size-12 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="size-6 text-success" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-success">Check your email</p>
            <p className="text-sm text-success/80">
              We&apos;ve sent password reset instructions to{" "}
              <span className="font-medium text-success">{form.getValues("email")}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full h-10 gap-2" onClick={() => setMode("login")}>
          <ArrowLeft className="size-4" />
          Back to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto space-y-8"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-10 pl-9 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--color-ring)]"
              {...form.register("email")}
            />
          </div>
          <AnimatePresence mode="wait">
            {form.formState.errors.email && (
              <motion.p
                key="email-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-destructive"
              >
                {form.formState.errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Button type="submit" className="w-full h-10">
          Send Reset Link
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Back to{" "}
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-primary hover:underline transition-colors font-medium"
        >
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
