import { PermissionGuard } from "@/components/auth/permission-guard";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AnimatedMain } from "@/components/layout/animated-main";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute target="/dashboard">
      <div className="flex h-screen overflow-hidden bg-layout-surface">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          {/* the tibeb woven rule — the stage's crown (locked §4.1 / §10.3) */}
          <div className="tibeb" aria-hidden="true" />
          <Header />
          <AnimatedMain>
            <PermissionGuard>{children}</PermissionGuard>
          </AnimatedMain>
        </div>
      </div>
    </ProtectedRoute>
  );
}
