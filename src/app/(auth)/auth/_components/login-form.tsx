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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-sm mx-auto space-y-8"
    >
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your admin account</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3">
        <Button variant="outline" className="h-10 gap-2" type="button" disabled>
          <svg className="size-4" viewBox="0 0 24 24" fill="none" role="img" aria-label="Google">
            <title>Google</title>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
        </div>
      </motion.div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="identifier">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-foreground" />
            <Input
              id="identifier"
              type="email"
              placeholder="you@example.com"
              className="h-10 pl-9 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--color-ring)]"
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
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="h-10 pl-9 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--color-ring)]"
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
        </motion.div>

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

        <motion.div variants={itemVariants}>
          <Button type="submit" className="w-full h-10" disabled={loginMutation.isPending}>
            {loginMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {loginMutation.isPending ? "Signing in…" : "Sign In"}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
