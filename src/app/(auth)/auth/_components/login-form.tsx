"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
        router.push("/en/dashboard");
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-black space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email</Label>
          <Input
            className="border-gray-400"
            id="identifier"
            type="email"
            placeholder="you@example.com"
            {...form.register("identifier")}
          />
          {form.formState.errors.identifier && (
            <p className="text-sm text-red-500">{form.formState.errors.identifier.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Input
            className="border-gray-400"
            id="password"
            type="password"
            placeholder="Enter your password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        {form.formState.errors.root && (
          <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in…" : "Sign In"}
        </Button>

        <p className="text-sm text-center">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => setMode("register")}
            className="text-blue-600 hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
}
