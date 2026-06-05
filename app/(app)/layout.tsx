import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

// FR-2.4: any app route requires auth.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <div className="layout-sidebar container" style={{ paddingBlock: "var(--space-24)" }}>
        <Sidebar userName={user.fullName} userEmail={user.email} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
