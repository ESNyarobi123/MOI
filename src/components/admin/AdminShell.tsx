"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/admin/fetch";
import {
  IconBadgeCheck,
  IconChart,
  IconChevronLeft,
  IconChevronRight,
  IconFlag,
  IconHeartHandshake,
  IconLayoutDashboard,
  IconLogOut,
  IconMegaphone,
  IconSparkles,
  IconUsers,
  IconWallet
} from "@/components/admin/AdminIcons";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin/overview",  label: "Dashboard",     Icon: IconLayoutDashboard },
      { href: "/admin/analytics", label: "Analytics",     Icon: IconChart },
      { href: "/admin/engagement",label: "Matches & Chats", Icon: IconHeartHandshake },
    ]
  },
  {
    label: "Members",
    items: [
      { href: "/admin/users",         label: "Users",          Icon: IconUsers },
      { href: "/admin/verifications", label: "Verifications",  Icon: IconBadgeCheck },
      { href: "/admin/reports",       label: "Safety Reports", Icon: IconFlag },
    ]
  },
  {
    label: "Revenue",
    items: [
      { href: "/admin/payments", label: "Payments",    Icon: IconWallet },
      { href: "/admin/plans",    label: "Plans",        Icon: IconSparkles },
    ]
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/content",  label: "Content",      Icon: IconMegaphone },
    ]
  }
] as const;

function initials(email: string) {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "AD";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState("admin@moidate.com");
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    // Try to decode email from token
    try {
      const token = getAdminToken() ?? "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.email) setEmail(payload.email);
    } catch {
      // ignore
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    const saved = window.localStorage.getItem("admin.sidebar.collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("admin.sidebar.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function logout() {
    clearAdminToken();
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="admin-app admin-boot">
        <div className="admin-boot-inner">
          <span className="admin-loading-dot" />
          <p>Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-app admin-shell ${collapsed ? "admin-shell--collapsed" : ""}`}>
      {/* Scrim */}
      <div
        className={`admin-nav-scrim ${mobileNavOpen ? "admin-nav-scrim--visible" : ""}`}
        aria-hidden={!mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-nav ${mobileNavOpen ? "admin-nav--open" : ""}`}>
        {/* Brand */}
        <div className="admin-nav-brand">
          <Image src="/moidate.png" alt="MoiDate" width={36} height={36} className="admin-nav-brand-icon" priority />
          <div className="admin-nav-brand-text">
            <span className="admin-nav-logo">MoiDate</span>
            <span className="admin-nav-logo-sub">Admin Console</span>
          </div>
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IconChevronRight style={{ width: 14, height: 14 }} /> : <IconChevronLeft style={{ width: 14, height: 14 }} />}
          </button>
        </div>

        {/* Navigation groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="admin-nav-group">
            <p className="admin-nav-section-label">{group.label}</p>
            {group.items.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`admin-nav-link ${pathname === href ? "active" : ""}`}
                title={collapsed ? label : undefined}
                aria-label={label}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon className="admin-nav-icon" aria-hidden />
                <span className="admin-nav-link-label">{label}</span>
              </Link>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div className="admin-nav-footer">
          <div className="admin-nav-user">
            <div className="admin-nav-avatar">{initials(email)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="admin-nav-user-name">{email.split("@")[0]}</div>
              <span className="admin-nav-user-role">Administrator</span>
            </div>
          </div>
          <button type="button" className="admin-logout" onClick={logout}>
            <IconLogOut className="admin-nav-icon" aria-hidden />
            <span className="admin-nav-link-label">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-body">
        {/* Desktop topbar */}
        <div className="admin-topbar">
          <div />
          <div className="admin-topbar-right">
            <span className="admin-topbar-time">{now}</span>
            <span className="admin-chip" style={{ fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--admin-ok)", display: "inline-block", marginRight: 6 }} />
              Live
            </span>
          </div>
        </div>

        {/* Mobile topbar */}
        <header className="admin-mobile-topbar">
          <button
            type="button"
            className="admin-burger"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
          <span className="admin-mobile-topbar-title">MoiDate Admin</span>
        </header>

        <main className="admin-main">
          <div className="admin-main-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
