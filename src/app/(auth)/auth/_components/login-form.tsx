"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ✅ Schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginFormProps = {
  switchToRegister: () => void;
  switchToForgot: () => void;
};

export function LoginForm({ switchToRegister, switchToForgot }: LoginFormProps) {
  // ✅ Initialize form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ✅ Submit handler
  const onSubmit = (data: LoginFormData) => {
    console.log("Login Data:", data);
    // 👉 Replace with your API call (useLogin hook)
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div className="text-black space-y-6">
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

        {/* Password + Forgot */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>

          <Input
            className="border-gray-400"
            id="password"
            type="password"
            placeholder="Enter your password"
            {...form.register("password")}
          />

          <button type="button" onClick={switchToForgot} className="text-sm text-blue-600">
            Forgot password?
          </button>
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full">
          Sign In
        </Button>

        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <button type="button" onClick={switchToRegister} className="text-blue-600">
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
}
