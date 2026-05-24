import { ProtectedRoute } from "@/components/auth/protected-route";
import { AnimatedMain } from "@/components/layout/animated-main";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute target="/dashboard">
      <div className="relative flex h-screen overflow-hidden bg-layout-surface">
        {/* Muted background orbs to provide depth */}
        <div className="glow-orb absolute -top-40 -right-40 size-96 bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="glow-orb absolute -bottom-40 left-1/3 size-96 bg-info/5 rounded-full blur-[100px] pointer-events-none" />

        <Sidebar />
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          <AnimatedMain>{children}</AnimatedMain>
        </div>
      </div>
    </ProtectedRoute>
  );
}
