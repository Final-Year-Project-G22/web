"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthMode } from "../_stores/auth-local.store";

export function ForgotPasswordForm() {
  const setMode = useAuthMode((state) => state.setMode);
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);

  const forgotSchema = z.object({
    email: z.string().email(t("invalidEmail")),
  });

  type ForgotFormData = z.infer<typeof forgotSchema>;

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = () => {
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-3 rounded-lg border border-success/25 bg-success-tint p-5 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-success-tint">
            <CheckCircle2 className="size-5 text-success-strong" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-success-strong">{t("resetSentTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("resetSentBody")}{" "}
              <span className="font-medium text-foreground">{form.getValues("email")}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setMode("login")}>
          <ArrowLeft className="size-4" />
          {t("backToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("forgotTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("forgotSubtitle")}</p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="relative group">
            <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-fast group-focus-within:text-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              className="pl-8"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full">
          {t("sendResetLink")}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode("login")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-fast hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("backToLogin")}
        </button>
      </div>
    </div>
  );
}
