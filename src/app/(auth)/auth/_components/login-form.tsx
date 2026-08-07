"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../_services/auth.hook";
import { useAuthMode } from "../_stores/auth-local.store";

export function LoginForm() {
  const router = useRouter();
  const setMode = useAuthMode((state) => state.setMode);
  const t = useTranslations("auth");

  const loginSchema = z.object({
    identifier: z.string().min(1, t("emailRequired")),
    password: z.string().min(1, t("passwordRequired")),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (err: unknown) => {
        const maybe = err as { title?: string; detail?: string } | undefined;
        const msg =
          maybe?.title || maybe?.detail || (typeof err === "string" ? err : t("loginFailed"));
        form.setError("root", { message: msg });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("welcomeBack")}</h2>
        <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">{t("email")}</Label>
          <div className="relative group">
            <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-fast group-focus-within:text-foreground" />
            <Input
              id="identifier"
              type="email"
              placeholder={t("emailPlaceholder")}
              className="pl-8"
              {...form.register("identifier")}
            />
          </div>
          {form.formState.errors.identifier && (
            <p className="text-xs text-destructive">{form.formState.errors.identifier.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground transition-colors duration-fast hover:text-primary"
            >
              {t("forgotPassword")}
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-fast group-focus-within:text-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              className="pl-8"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        {form.formState.errors.root && (
          <p className="rounded-md border border-destructive/25 bg-destructive-tint px-3 py-2 text-xs text-destructive-strong">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {loginMutation.isPending ? t("signingIn") : t("signIn")}
        </Button>
      </form>
    </div>
  );
}
