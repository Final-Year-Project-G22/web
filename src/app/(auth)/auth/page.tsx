import { Shield } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { AuthCard } from "./_components/auth-card";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl shadow-2xl lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="bg-gradient-to-br from-auth-gradient-from to-auth-gradient-to text-white p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Shield className="size-5" />
              </div>
              <h2 className="text-xl font-semibold">{APP_NAME}</h2>
            </div>

            <h1 className="text-3xl font-bold mb-4">Secure Access for Administrators</h1>

            <p className="text-white/70 mb-10">
              Join the platform dedicated to empowering MSMEs with AI-driven insights and secure
              management tools.
            </p>

            <div className="space-y-6">
              <Feature
                title="Enterprise Security"
                desc="Multi-factor authentication and role-based access control for all admin accounts."
              />
              <Feature
                title="Granular Permissions"
                desc="Customizable access levels for Moderators, Content Managers, and System Admins."
              />
              <Feature
                title="Comprehensive Audit Logs"
                desc="Every action is logged and monitorable to ensure platform integrity."
              />
            </div>
          </div>

          <p className="text-xs text-white/40">
            Powered by {APP_NAME} Tech • {APP_VERSION}
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-card p-8 flex items-center justify-center">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-white/60">{desc}</p>
    </div>
  );
}
