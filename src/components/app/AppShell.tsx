"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUserSession, getUserAccessToken } from "@/lib/app/user-session";

const NAV = [
  { href: "/app", label: "Home" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/discover", label: "Discover" },
  { href: "/app/matches", label: "Matches" },
  { href: "/app/chat", label: "Chat" },
  { href: "/app/notifications", label: "Notifications" },
  { href: "/app/premium", label: "Premium" },
  { href: "/app/safety", label: "Safety" },
  { href: "/app/settings", label: "Settings" },
  { href: "/app/help", label: "Help" }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getUserAccessToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  function logout() {
    clearUserSession();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="member-app" style={{ padding: 24 }}>
        Checking session…
      </div>
    );
  }

  return (
    <div className="member-app member-shell">
      <nav className="member-nav">
        <div style={{ padding: "0 20px 16px", fontWeight: 600, fontSize: 15 }}>
          MoiDate
        </div>
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? "active" : ""}
          >
            {label}
          </Link>
        ))}
        <button type="button" className="member-logout" onClick={logout}>
          Log out
        </button>
      </nav>
      <div className="member-main">{children}</div>
    </div>
  );
}
