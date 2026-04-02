"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ switchToLogin }: { switchToLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = password.length > 12 ? "Strong" : password.length > 8 ? "Medium" : "Weak";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-black">Admin Account Request</h2>
          <p className="text-sm text-muted-foreground text-right">Step 1 of 2</p>
        </div>

        <div className="mt-2 h-2 bg-gray-200 rounded">
          <div className="h-2 w-1/2 bg-blue-600 rounded"></div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div className="space-y-5">
          <Label className="text-black">Full Name</Label>
          <Input className="border-gray-400" placeholder="e.g. Sarah Jenkins" />
        </div>

        <div className="space-y-5">
          <Label className="text-black">Organization Email</Label>
          <Input className="border-gray-400" placeholder="name@organization.com" />
          <p className="text-xs text-muted-foreground">Must use a valid organizational domain.</p>
        </div>

        <div className="text-black">
          <Label className="block text-sm mb-1">Requested Role</Label>
          <select className="w-full border border-gray-400 rounded-lg p-3 text-sm">
            <option>Select a role...</option>
            <option>Admin</option>
            <option>Moderator</option>
          </select>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs p-3 rounded">
          Content Managers can publish and edit articles. Moderators can review user comments and
          flag content. System Admins have full access.
        </div>

        {/* Password */}
        <div className="space-y-5">
          <Label className="text-black">Password</Label>

          {/* 👁 Input with toggle */}
          <div className="relative">
            <Input
              className="border-gray-200 text-black pr-10"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Strength */}
          <div className="flex gap-1 mt-2">
            <div className="h-1 flex-1 bg-green-500 rounded"></div>
            <div className="h-1 flex-1 bg-green-500 rounded"></div>
            <div className="h-1 flex-1 bg-gray-200 rounded"></div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs text-muted-foreground">Strength: {strength}</p>
            <p className="text-xs bg-gray-50 border border-gray-200 text-muted-foreground">
              Min 8 chars
            </p>
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center space-x-2 text-black">
          <input type="checkbox" />
          <span>
            I agree to the <b className="text-purple-500">Admin Security Policy</b> and{" "}
            <b className="text-purple-500">Terms of Service</b>.
          </span>
        </div>

        {/* Button */}
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5">
          Request Access
        </Button>

        {/* Switch */}
        <p className="text-sm text-center text-black">
          Already have an account?{" "}
          <button type="button" onClick={switchToLogin} className="text-blue-600">
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
