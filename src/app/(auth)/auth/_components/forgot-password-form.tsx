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
        className="space-y-5"
      >
        <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            <p className="font-medium">Check your email</p>
          </div>
          <p className="text-sm text-success/80">
            We&apos;ve sent password reset instructions to{" "}
            <b className="text-success">{form.getValues("email")}</b>.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setMode("login")}>
          <ArrowLeft className="size-4" />
          Back to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Forgot Password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-8"
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

        <Button type="submit" className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Back to{" "}
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-primary hover:underline transition-colors"
        >
          Login
        </button>
      </p>
    </motion.div>
  );
}
