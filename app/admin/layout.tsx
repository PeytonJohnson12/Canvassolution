import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminHeader } from "@/components/AdminHeader";

// Admin-only area. Non-admins are bounced.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <AdminHeader />
      <main className="container" style={{ paddingBlock: "var(--space-32)" }}>
        {children}
      </main>
    </div>
  );
}
