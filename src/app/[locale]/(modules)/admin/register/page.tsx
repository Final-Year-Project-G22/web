"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdminRegister } from "@/app/(auth)/auth/_services/auth.hook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listRoles } from "@/lib/api/services/roles";
import type { ErrorModel, RoleDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterAdminPage() {
  const _router = useRouter();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"success" | "error" | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", username: "" },
  });

  const rolesQuery = useQuery<RoleDTO[], ErrorModel>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await listRoles();
      if (res.status !== 200) throw res.data;
      return (res.data.roles ?? []).filter(Boolean);
    },
  });

  const registerMutation = useAdminRegister();

  const onSubmit = (data: RegisterFormData) => {
    setNotice(null);
    setNoticeType(null);
    registerMutation.mutate(
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username || undefined,
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : null,
      },
      {
        onSuccess: (res) => {
          setNotice(res.message);
          setNoticeType("success");
        },
        onError: (err) => {
          setNotice(getErrorMessage(err));
          setNoticeType("error");
        },
      }
    );
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Register New Admin</CardTitle>
          <CardDescription>
            Create a new admin account. An auto-generated password will be emailed to the user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/en/dashboard">Back to Dashboard</Link>
          </Button>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Sarah" {...form.register("firstName")} />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Jenkins" {...form.register("lastName")} />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@organization.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input id="username" placeholder="sarah_jenkins" {...form.register("username")} />
            </div>

            <div className="space-y-2">
              <Label>Assign Roles</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {rolesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading roles&hellip;</p>
                ) : (
                  rolesQuery.data?.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                      />
                      {role.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            {notice && (
              <div
                className={`text-sm p-3 rounded border ${
                  noticeType === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {notice}
              </div>
            )}

            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating Account…" : "Register Admin"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
