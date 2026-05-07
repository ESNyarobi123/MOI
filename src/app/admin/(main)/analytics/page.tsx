"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { adminJson } from "@/lib/admin/fetch";
import {
  IconActivity,
  IconHeartHandshake,
  IconRefresh,
  IconTrendingUp,
  IconUsers
} from "@/components/admin/AdminIcons";

type Analytics = {
  totalUsers: number;
  verifiedEmailUsers: number;
  activeMatches: number;
  totalChats: number;
  messagesLast24h: number;
  distinctChatsWithMessagesLast24h: number;
  openReports: number;
  pendingVerifications: number;
  generatedAt: string;
  activeUsers24h: number;
  newUsers7d: number;
  totalMessages: number;
  totalSwipes: number;
};

const SIMULATED_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SIMULATED_SIGNUPS = [12, 24, 18, 31, 27, 45, 38];
const SIMULATED_ACTIVE  = [48, 62, 54, 71, 83, 95, 88];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function MiniBar({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <div
            style={{
              width: "100%",
              borderRadius: "5px 5px 0 0",
              background: i === data.length - 1 ? color : "var(--admin-surface-3)",
              border: "1px solid var(--admin-border)",
              height: `${(v / max) * 100}%`,
              minHeight: 4,
              transition: "height 0.3s ease"
            }}
            title={`${labels[i]}: ${v}`}
          />
          <div style={{ fontSize: 10, color: "var(--admin-muted-2)" }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: "var(--admin-text)" }}>{label}</span>
        <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>
          {fmt(value)} <span style={{ color: "var(--admin-muted-2)", fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div className="admin-progress">
        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${pct}%`, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminJson<Analytics>("/admin/analytics")
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (err) {
    return (
      <div>
        <AdminPageHeader title="Analytics" description="Platform engagement metrics." />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Engagement signals: activity windows, growth, and cumulative actions — privacy-safe aggregates only."
        meta={data ? `Generated · ${new Date(data.generatedAt).toLocaleString()}` : undefined}
        actions={
          <button className="admin-btn ghost" onClick={load} disabled={loading}>
            <IconRefresh style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        }
      />

      {loading || !data ? (
        <AdminStatSkeleton count={4} />
      ) : (
        <>
          {/* KPI cards */}
          <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginBottom: 24 }}>
            {[
              { label: "Active users (24h)",     value: data.activeUsers24h,  tone: "purple" as const, Icon: IconUsers,          trend: "realtime" },
              { label: "New signups (7d)",        value: data.newUsers7d,      tone: "rose"   as const, Icon: IconActivity,       trend: "+growth" },
              { label: "Total messages",          value: data.totalMessages,   tone: "mint"   as const, Icon: IconActivity,       trend: "all time" },
              { label: "Total swipes",            value: data.totalSwipes,     tone: "amber"  as const, Icon: IconHeartHandshake, trend: "all time" },
            ].map(({ label, value, tone, Icon, trend }) => (
              <div key={label} className={`admin-stat admin-stat--${tone}`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <label style={{ margin: 0 }}>{label}</label>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--admin-surface-3)", display: "grid", placeItems: "center", color: "var(--admin-accent-2)", flexShrink: 0 }}>
                    <Icon style={{ width: 16, height: 16 }} />
                  </span>
                </div>
                <strong>{fmt(value)}</strong>
                <div className="admin-stat-trend up">
                  <IconTrendingUp style={{ width: 12, height: 12 }} />
                  {trend}
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
            <div className="admin-panel" style={{ marginBottom: 0 }}>
              <div className="admin-panel-head">
                <span className="admin-panel-title">New signups — last 7 days</span>
                <span className="admin-chip">Simulated trend</span>
              </div>
              <MiniBar data={SIMULATED_SIGNUPS} labels={SIMULATED_DAYS} color="var(--admin-accent)" />
              <p style={{ fontSize: 12, color: "var(--admin-muted-2)", marginTop: 10 }}>
                Peak: <strong style={{ color: "var(--admin-text)" }}>{Math.max(...SIMULATED_SIGNUPS)}</strong> signups on Saturday
              </p>
            </div>

            <div className="admin-panel" style={{ marginBottom: 0 }}>
              <div className="admin-panel-head">
                <span className="admin-panel-title">Daily active users — last 7 days</span>
                <span className="admin-chip">Simulated trend</span>
              </div>
              <MiniBar data={SIMULATED_ACTIVE} labels={SIMULATED_DAYS} color="var(--admin-primary)" />
              <p style={{ fontSize: 12, color: "var(--admin-muted-2)", marginTop: 10 }}>
                Peak: <strong style={{ color: "var(--admin-text)" }}>{Math.max(...SIMULATED_ACTIVE)}</strong> DAU on Saturday
              </p>
            </div>
          </div>

          {/* Engagement funnel */}
          <div className="admin-panel">
            <div className="admin-panel-head">
              <span className="admin-panel-title">Engagement funnel</span>
              <span className="admin-chip">{fmt(data.totalUsers)} total members</span>
            </div>
            <FunnelRow
              label="Signed up"
              value={data.totalUsers}
              total={data.totalUsers}
              color="var(--admin-primary)"
            />
            <FunnelRow
              label="Email verified"
              value={data.verifiedEmailUsers}
              total={data.totalUsers}
              color="var(--admin-primary-3)"
            />
            <FunnelRow
              label="Made at least 1 match"
              value={data.activeMatches}
              total={data.totalUsers}
              color="var(--admin-accent)"
            />
            <FunnelRow
              label="Sent a message"
              value={data.distinctChatsWithMessagesLast24h}
              total={data.totalUsers}
              color="#b13a75"
            />
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {[
              { label: "Msgs per active user (24h)", value: data.activeUsers24h > 0 ? (data.messagesLast24h / data.activeUsers24h).toFixed(1) : "—" },
              { label: "Avg matches per user",       value: data.totalUsers > 0 ? (data.activeMatches / data.totalUsers).toFixed(2) : "—" },
              { label: "Msgs per chat (all time)",   value: data.totalChats > 0 ? (data.totalMessages / data.totalChats).toFixed(1) : "—" },
              { label: "Swipes per user",            value: data.totalUsers > 0 ? (data.totalSwipes / data.totalUsers).toFixed(1) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="admin-stat admin-stat--mint">
                <label>{label}</label>
                <strong style={{ fontSize: "1.4rem" }}>{value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
