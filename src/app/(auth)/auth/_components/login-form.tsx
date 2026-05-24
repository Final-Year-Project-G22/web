"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../_services/auth.hook";
import { useAuthMode } from "../_stores/auth-local.store";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setMode = useAuthMode((state) => state.setMode);

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
          maybe?.title ||
          maybe?.detail ||
          (typeof err === "string" ? err : "Login failed. Check your credentials.");
        form.setError("root", { message: msg });
      },
    });
  };

  return (
    <motion.form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email</Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="identifier"
              type="email"
              placeholder="you@example.com"
              className="pl-8"
              {...form.register("identifier")}
            />
          </div>
          <AnimatePresence mode="wait">
            {form.formState.errors.identifier && (
              <motion.p
                key="identifier-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-destructive"
              >
                {form.formState.errors.identifier.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-sm text-primary hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="pl-8"
              {...form.register("password")}
            />
          </div>
          <AnimatePresence mode="wait">
            {form.formState.errors.password && (
              <motion.p
                key="password-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-destructive"
              >
                {form.formState.errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {form.formState.errors.root && (
            <motion.p
              key="root-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm text-destructive"
            >
              {form.formState.errors.root.message}
            </motion.p>
          )}
        </AnimatePresence>

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {loginMutation.isPending ? "Signing in…" : "Sign In"}
        </Button>
      </div>
    </motion.form>
  );
}
