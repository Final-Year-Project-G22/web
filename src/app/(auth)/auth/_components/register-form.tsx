"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listRoles } from "@/lib/api/services/roles";
import type { ErrorModel, RoleDTO } from "@/lib/api/types";
import { useAdminRegister } from "../_services/auth.hook";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function getErrorMessage(err: unknown) {
  const maybe = err as Partial<ErrorModel> | undefined;
  if (maybe && typeof maybe.title === "string" && maybe.title.trim()) return maybe.title;
  if (maybe && typeof maybe.detail === "string" && maybe.detail.trim()) return maybe.detail;
  try {
    return JSON.stringify(err);
  } catch {
    return "Request failed";
  }
}

export function RegisterForm({ switchToLogin }: { switchToLogin: () => void }) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
    },
  });

  const rolesQuery = useQuery<RoleDTO[], ErrorModel>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await listRoles();
      if (res.status !== 200) throw res.data;
      return (res.data.roles ?? []).filter(Boolean);
    },
  });

  const roles: RoleDTO[] = rolesQuery.data ?? [];

  const adminRegisterMutation = useAdminRegister();

  const onSubmit = (data: RegisterFormData) => {
    setNotice(null);
    adminRegisterMutation.mutate(
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username || undefined,
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : null,
      },
      {
        onSuccess: (res) => {
          setNotice(`${res.message} Account ID: ${res.accountId}`);
          setTimeout(() => router.push("/auth"), 3000);
        },
        onError: (err) => {
          setNotice(getErrorMessage(err));
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 text-black">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-black">Admin Account Request</h2>
          <p className="text-sm text-muted-foreground text-right">Step 1 of 2</p>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded">
          <div className="h-2 w-1/2 bg-blue-600 rounded"></div>
        </div>
      </div>

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
        <Label htmlFor="email">Organization Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@organization.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Must use a valid organizational domain.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username (optional)</Label>
        <Input id="username" placeholder="sarah_jenkins" {...form.register("username")} />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Assign Roles</Label>
        <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
          {rolesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles&hellip;</p>
          ) : rolesQuery.isError ? (
            <p className="text-sm text-muted-foreground">Failed to load roles</p>
          ) : (
            roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                <span className="text-sm">{role.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs p-3 rounded">
        An auto-generated password will be emailed to the new admin. Content Managers can publish
        and edit articles. Moderators can review user comments. System Admins have full access.
      </div>

      {notice && (
        <div
          className={`text-sm p-3 rounded border ${
            notice.includes("Account ID")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notice}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={adminRegisterMutation.isPending}>
        {adminRegisterMutation.isPending ? "Creating Account…" : "Request Access"}
      </Button>

      <p className="text-sm text-center text-black">
        Already have an account?{" "}
        <button type="button" onClick={switchToLogin} className="text-blue-600 hover:underline">
          Sign in here
        </button>
      </p>
    </form>
  );
}
