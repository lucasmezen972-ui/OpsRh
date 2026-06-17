import { SidebarNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getNotifications, getProfile } from "@/lib/data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = getProfile();
  const notifications = getNotifications();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card lg:block">
        <SidebarNav />
      </aside>

      <div className="lg:pl-64">
        <Topbar profile={profile} notifications={notifications} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
