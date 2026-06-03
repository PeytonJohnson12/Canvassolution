"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./BrandMark";

const NAV = [
  { href: "/", label: "Plan", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/connections", label: "Connections", icon: "M8 7a4 4 0 1 1 8 0M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5H9.6L9.2 5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5 10a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4.8l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.06-.32.1-.65.1-1Z" },
  { href: "/account", label: "Account", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" },
];

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 bg-white px-4 py-6">
      <Link href="/" className="px-2">
        <BrandMark />
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-gray-50 hover:text-ink"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d={item.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-100 pt-4">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-ink">{userName}</p>
          <p className="truncate text-xs text-muted">{userEmail}</p>
        </div>
        <button onClick={logout} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted hover:bg-gray-50 hover:text-ink">
          Log out
        </button>
      </div>
    </aside>
  );
}
