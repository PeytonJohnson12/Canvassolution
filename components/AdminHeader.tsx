"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";

export function AdminHeader() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="navbar">
      <BrandMark />
      <span className="badge badge-violet">Admin</span>
      <div className="navbar-user">
        <ThemeToggle className="btn btn-sm btn-secondary" />
        <button onClick={logout} className="btn btn-sm btn-secondary">Log out</button>
      </div>
    </header>
  );
}
