"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountPassword } from "@/lib/api/services/authentication";
import type { UpdateAccountPasswordRequest } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

const passwordSchema = z
  .object({
    existingPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      existingPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const payload: UpdateAccountPasswordRequest = {
        existingPassword: data.existingPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };
      const res = await accountPassword(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      setNotice("Password changed successfully.");
      form.reset();
    },
    onError: (err) => setNotice(getErrorMessage(err)),
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/en/dashboard">Back to Dashboard</Link>
          </Button>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((d) => {
              setNotice(null);
              changePasswordMutation.mutate(d);
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="existingPassword">Current Password</Label>
              <Input
                id="existingPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("existingPassword")}
              />
              {form.formState.errors.existingPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.existingPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("newPassword")}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {notice && (
              <div
                className={`text-sm p-3 rounded border ${
                  notice.includes("success")
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {notice}
              </div>
            )}

            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Changing…" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
