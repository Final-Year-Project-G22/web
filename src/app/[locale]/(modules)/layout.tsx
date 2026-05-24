import { ProtectedRoute } from "@/components/auth/protected-route";
import { AnimatedMain } from "@/components/layout/animated-main";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute target="/dashboard">
      <div className="flex h-screen overflow-hidden bg-layout-surface">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          <AnimatedMain>{children}</AnimatedMain>
        </div>
      </div>
    </ProtectedRoute>
  );
}
