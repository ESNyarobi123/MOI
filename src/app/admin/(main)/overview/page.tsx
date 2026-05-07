"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { adminJson } from "@/lib/admin/fetch";
import {
  IconActivity,
  IconBadgeCheck,
  IconFlag,
  IconHeartHandshake,
  IconRefresh,
  IconTrendingUp,
  IconUsers,
  IconWallet
} from "@/components/admin/AdminIcons";

type Overview = {
  totalUsers: number;
  verifiedEmailUsers: number;
  activeMatches: number;
  totalChats: number;
  messagesLast24h: number;
  distinctChatsWithMessagesLast24h: number;
  openReports: number;
  pendingVerifications: number;
  generatedAt: string;
};

const MOCK_BARS = [42, 68, 55, 80, 72, 91, 88, 76, 65, 95, 83, 74, 88, 100];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const QUICK_LINKS = [
  { href: "/admin/users",         label: "Manage users",     Icon: IconUsers,         color: "var(--admin-primary)" },
  { href: "/admin/verifications", label: "Pending verif.",   Icon: IconBadgeCheck,    color: "var(--admin-ok)" },
  { href: "/admin/reports",       label: "Open reports",     Icon: IconFlag,           color: "var(--admin-danger)" },
  { href: "/admin/payments",      label: "Subscriptions",    Icon: IconWallet,         color: "var(--admin-accent)" },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    setRefreshing(true);
    adminJson<Overview>("/admin/overview")
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setRefreshing(false));
  }

  useEffect(() => { load(); }, []);

  if (err) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" description="Platform health at a glance." />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  if (!data && refreshing) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" description="Platform health at a glance." />
        <AdminStatSkeleton count={8} />
      </div>
    );
  }

  const stats = data ? [
    { label: "Total Members",      value: data.totalUsers,             tone: "purple" as const, Icon: IconUsers,         trend: "+12%" },
    { label: "Verified Emails",    value: data.verifiedEmailUsers,     tone: "mint"   as const, Icon: IconBadgeCheck,    trend: "+8%" },
    { label: "Active Matches",     value: data.activeMatches,          tone: "rose"   as const, Icon: IconHeartHandshake,trend: "+5%" },
    { label: "Total Chats",        value: data.totalChats,             tone: "rose"   as const, Icon: IconActivity,      trend: "+18%" },
    { label: "Messages (24h)",     value: data.messagesLast24h,        tone: "mint"   as const, Icon: IconActivity,      trend: "live" },
    { label: "Active Chats (24h)", value: data.distinctChatsWithMessagesLast24h, tone: "mint" as const, Icon: IconHeartHandshake, trend: "live" },
    { label: "Open Reports",       value: data.openReports,            tone: "alert"  as const, Icon: IconFlag,          trend: data.openReports > 5 ? "high" : "low" },
    { label: "Pending Verif.",     value: data.pendingVerifications,   tone: "amber"  as const, Icon: IconBadgeCheck,    trend: "queue" },
  ] : [];

  const barMax = Math.max(...MOCK_BARS);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Platform health — aggregate metrics only, no private message content."
        meta={data ? `Last updated · ${new Date(data.generatedAt).toLocaleString()}` : undefined}
        actions={
          <button type="button" className="admin-btn ghost" onClick={load} disabled={refreshing}>
            <IconRefresh style={{ width: 15, height: 15 }} />
            Refresh
          </button>
        }
      />

      {/* KPI Grid */}
      {!data ? <AdminStatSkeleton count={8} /> : (
        <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
          {stats.map(({ label, value, tone, Icon, trend }) => (
            <div key={label} className={`admin-stat admin-stat--${tone}`}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ margin: 0 }}>{label}</label>
                <span style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "var(--admin-surface-3)",
                  display: "grid", placeItems: "center",
                  color: "var(--admin-accent-2)", flexShrink: 0
                }}>
                  <Icon style={{ width: 16, height: 16 }} />
                </span>
              </div>
              <strong>{fmt(value)}</strong>
              <div className={`admin-stat-trend ${trend === "high" || trend === "live" ? "flat" : "up"}`}>
                <IconTrendingUp style={{ width: 12, height: 12 }} />
                {trend}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column: Activity + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, marginBottom: 24 }}>
        {/* Activity bar chart panel */}
        <div className="admin-panel" style={{ marginBottom: 0 }}>
          <div className="admin-panel-head">
            <span className="admin-panel-title">Message activity — last 14 days</span>
            <span className="admin-chip">Estimated</span>
          </div>
          <div className="admin-bar-chart" style={{ height: 100 }}>
            {MOCK_BARS.map((v, i) => (
              <div key={i} className="admin-bar-col">
                <div
                  className={`admin-bar ${i === MOCK_BARS.length - 1 ? "active" : ""}`}
                  style={{ height: `${(v / barMax) * 100}%` }}
                  title={`Day ${i + 1}: ${v} msgs`}
                />
                {i % 3 === 0 && <div className="admin-bar-label">D{i + 1}</div>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--admin-muted-2)", marginTop: 8 }}>
            Illustrative trend · real data via analytics endpoint
          </p>
        </div>

        {/* Quick actions */}
        <div className="admin-panel" style={{ marginBottom: 0 }}>
          <div className="admin-panel-head">
            <span className="admin-panel-title">Quick actions</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {QUICK_LINKS.map(({ href, label, Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="admin-btn"
                style={{
                  justifyContent: "flex-start",
                  width: "100%",
                  color,
                  borderColor: "var(--admin-border)",
                  background: "var(--admin-surface-2)"
                }}
              >
                <Icon style={{ width: 16, height: 16, color }} />
                {label}
              </Link>
            ))}
          </div>
          <div className="admin-divider" />
          {data && (
            <div style={{ fontSize: 13 }}>
              {data.openReports > 0 && (
                <div className="admin-feed-item" style={{ paddingTop: 0 }}>
                  <div className="admin-feed-dot danger" />
                  <div className="admin-feed-body">
                    <strong>{data.openReports}</strong> open safety report{data.openReports !== 1 ? "s" : ""} need attention
                  </div>
                </div>
              )}
              {data.pendingVerifications > 0 && (
                <div className="admin-feed-item">
                  <div className="admin-feed-dot warn" />
                  <div className="admin-feed-body">
                    <strong>{data.pendingVerifications}</strong> verification{data.pendingVerifications !== 1 ? "s" : ""} pending review
                  </div>
                </div>
              )}
              {data.openReports === 0 && data.pendingVerifications === 0 && (
                <div className="admin-feed-item" style={{ paddingTop: 0 }}>
                  <div className="admin-feed-dot ok" />
                  <div className="admin-feed-body" style={{ color: "var(--admin-muted)" }}>No urgent items — all clear</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Platform Health */}
      <div className="admin-panel" style={{ marginBottom: 0 }}>
        <div className="admin-panel-head">
          <span className="admin-panel-title">Platform health indicators</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
          {data && [
            {
              label: "Email verification rate",
              value: data.totalUsers > 0 ? Math.round((data.verifiedEmailUsers / data.totalUsers) * 100) : 0,
              unit: "%"
            },
            {
              label: "Chat engagement",
              value: data.totalUsers > 0 ? Math.round((data.totalChats / data.totalUsers) * 100) : 0,
              unit: "%"
            },
            {
              label: "Match rate",
              value: data.totalUsers > 0 ? Math.round((data.activeMatches / data.totalUsers) * 100) : 0,
              unit: "%"
            },
          ].map(({ label, value, unit }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>{label}</span>
                <strong style={{ color: "var(--admin-primary)" }}>{value}{unit}</strong>
              </div>
              <div className="admin-progress">
                <div className="admin-progress-fill" style={{ width: `${Math.min(value, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
