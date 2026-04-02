import { AuthCard } from "./_components/auth-card";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl shadow-xl lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="bg-gradient-to-br from-[#0B1A3A] to-[#1E2A55] text-white p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
                ⬛
              </div>
              <h2 className="text-xl font-semibold mb-10">Adisu Serategna</h2>
            </div>

            <h1 className="text-3xl font-bold mb-4">Secure Access for Administrators</h1>

            <p className="text-gray-300 mb-10">
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

          <p className="text-xs text-gray-400">Powered by Adisu Serategna Tech • v2.4.0</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white p-8 flex items-center justify-center">
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
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}
