"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Plan", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/connections", label: "Connections", icon: "M8 7a4 4 0 1 1 8 0M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5H9.6L9.2 5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5 10a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4.8l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.06-.32.1-.65.1-1Z" },
  { href: "/account", label: "Account", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar card-default app-sidebar">
      <Link href="/" className="block px-2 py-1" style={{ marginBottom: "var(--space-8)" }}>
        <BrandMark />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item ${active ? "is-active" : ""}`}>
              <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d={item.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <ThemeToggle />
        <div className="flex items-center gap-3 px-2 py-1">
          <span className="avatar avatar-md">{initials(userName)}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{userName}</div>
            <div className="caption truncate">{userEmail}</div>
          </div>
        </div>
        <button onClick={logout} className="sidebar-item w-full">
          <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
