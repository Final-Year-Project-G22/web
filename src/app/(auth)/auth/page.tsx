import { CheckCircle2, KeyRound, Shield } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { AuthCard } from "./_components/auth-card";

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Multi-factor authentication and role-based access control for all admin accounts.",
  },
  {
    icon: KeyRound,
    title: "Granular Permissions",
    desc: "Customizable access levels for Moderators, Content Managers, and System Admins.",
  },
  {
    icon: CheckCircle2,
    title: "Comprehensive Audit Logs",
    desc: "Every action is logged and monitorable to ensure platform integrity.",
  },
];

export default function AuthPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted p-4 sm:p-6 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="relative bg-gradient-to-br from-auth-gradient-from to-auth-gradient-to text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden">
          {/* Dot grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 size-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-12">
              <div className="size-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
                <Shield className="size-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{APP_NAME}</h2>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-[1.1]">
              Secure Access for Administrators
            </h1>

            <p className="text-white/60 text-base leading-relaxed mb-12 max-w-md">
              Join the platform dedicated to empowering MSMEs with AI-driven insights and secure
              management tools.
            </p>

            <div className="space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4 group">
                  <div className="mt-0.5 size-8 rounded-lg bg-white/10 ring-1 ring-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/15 transition-colors">
                    <f.icon className="size-4 text-white/80" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{f.title}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-white/30 mt-12">
            Powered by {APP_NAME} Tech &bull; {APP_VERSION}
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-card p-8 sm:p-12 flex items-center justify-center">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}
