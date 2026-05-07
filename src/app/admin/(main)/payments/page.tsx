"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatSkeleton, AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { adminJson } from "@/lib/admin/fetch";
import {
  IconCreditCard,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconTrendingUp,
  IconWallet
} from "@/components/admin/AdminIcons";

type Summary = {
  stripeWebhookEnabled: boolean;
  recordedSubscriptions: number;
  activeSubscriptions: number;
  note: string;
};

type SubRow = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  plan: { code: string; name: string; priceUsd?: number };
  user: { id: string; email: string | null };
};

type Tab = "overview" | "subscriptions";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  ACTIVE:    { cls: "ok",      label: "Active"    },
  EXPIRED:   { cls: "neutral", label: "Expired"   },
  CANCELLED: { cls: "warn",    label: "Cancelled" },
  PENDING:   { cls: "info",    label: "Pending"   },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function AdminPaymentsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  function load() {
    setLoading(true);
    Promise.all([
      adminJson<Summary>("/admin/payments"),
      adminJson<{ items: SubRow[] }>("/admin/subscriptions?limit=500")
    ])
      .then(([s, list]) => {
        setSummary(s);
        setSubs(list.items);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filteredSubs = useMemo(() => {
    let list = subs;
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter.toUpperCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        (s.user.email?.toLowerCase() ?? "").includes(q) ||
        s.plan.name.toLowerCase().includes(q) ||
        s.plan.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [subs, search, statusFilter]);

  const planBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    subs.forEach((s) => {
      map[s.plan.name] = (map[s.plan.name] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [subs]);

  const activeSubs = subs.filter((s) => s.status === "ACTIVE");
  const expiredSubs = subs.filter((s) => s.status === "EXPIRED");

  function exportCsv() {
    const rows = [["Email","Plan","Code","Status","Starts","Ends"]];
    filteredSubs.forEach((s) => rows.push([
      s.user.email ?? "",
      s.plan.name,
      s.plan.code,
      s.status,
      new Date(s.startsAt).toLocaleDateString(),
      new Date(s.endsAt).toLocaleDateString()
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `moidate-subscriptions-${Date.now()}.csv`;
    a.click();
  }

  if (err) {
    return (
      <div>
        <AdminPageHeader title="Payments & Revenue" description="Billing and subscription management." />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Payments & Revenue"
        description="Subscription health, billing readiness, and member plan management."
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={exportCsv} disabled={loading}>
              <IconDownload style={{ width: 14, height: 14 }} />
              Export CSV
            </button>
            <button type="button" className="admin-btn ghost" onClick={load} disabled={loading}>
              <IconRefresh style={{ width: 14, height: 14 }} />
              Refresh
            </button>
          </>
        }
      />

      {/* Tab row */}
      <div className="admin-tab-row" style={{ marginBottom: 24, display: "inline-flex" }}>
        {(["overview", "subscriptions"] as Tab[]).map((t) => (
          <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <>
          {loading || !summary ? (
            <AdminStatSkeleton count={4} />
          ) : (
            <>
              {/* KPI cards */}
              <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                <div className={`admin-stat ${summary.stripeWebhookEnabled ? "admin-stat--mint" : "admin-stat--amber"}`}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ margin: 0 }}>Payment gateway</label>
                    <IconCreditCard style={{ width: 16, height: 16, color: "var(--admin-accent-2)" }} />
                  </div>
                  <strong style={{ fontSize: "1.1rem" }}>
                    {summary.stripeWebhookEnabled ? "Connected" : "Deferred"}
                  </strong>
                  <div className="admin-stat-sub">
                    {summary.stripeWebhookEnabled ? "Stripe webhook active" : "Manual mode — no Stripe key"}
                  </div>
                </div>

                <div className="admin-stat admin-stat--purple">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ margin: 0 }}>Total subscriptions</label>
                    <IconWallet style={{ width: 16, height: 16, color: "var(--admin-accent-2)" }} />
                  </div>
                  <strong>{fmt(summary.recordedSubscriptions)}</strong>
                  <div className={`admin-stat-trend up`}>
                    <IconTrendingUp style={{ width: 12, height: 12 }} /> all time
                  </div>
                </div>

                <div className="admin-stat admin-stat--mint">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ margin: 0 }}>Active now</label>
                    <IconSparkles style={{ width: 16, height: 16, color: "var(--admin-accent-2)" }} />
                  </div>
                  <strong>{fmt(summary.activeSubscriptions)}</strong>
                  <div className="admin-stat-sub">
                    {summary.recordedSubscriptions > 0
                      ? `${Math.round((summary.activeSubscriptions / summary.recordedSubscriptions) * 100)}% retention`
                      : "—"}
                  </div>
                </div>

                <div className="admin-stat admin-stat--amber">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ margin: 0 }}>Expired / churned</label>
                    <IconCreditCard style={{ width: 16, height: 16, color: "var(--admin-accent-2)" }} />
                  </div>
                  <strong>{fmt(expiredSubs.length)}</strong>
                  <div className="admin-stat-sub">Eligible for win-back</div>
                </div>
              </div>

              {/* Note */}
              {summary.note && (
                <div className="admin-panel" style={{ background: "var(--admin-info-bg)", borderColor: "rgba(29,78,216,0.15)" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--admin-info-text)" }}>
                    <strong>Note:</strong> {summary.note}
                  </p>
                </div>
              )}

              {/* Plan breakdown */}
              {planBreakdown.length > 0 && (
                <div className="admin-panel">
                  <div className="admin-panel-head">
                    <span className="admin-panel-title">Plan distribution</span>
                    <span className="admin-chip">{subs.length} total</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {planBreakdown.map(([name, count]) => (
                      <div key={name}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                          <span style={{ fontWeight: 600 }}>{name}</span>
                          <span style={{ color: "var(--admin-muted)" }}>
                            {count} ({subs.length > 0 ? Math.round((count / subs.length) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="admin-progress">
                          <div className="admin-progress-fill" style={{ width: `${subs.length > 0 ? (count / subs.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent active */}
              <h2 className="admin-section-title">Recent active subscriptions</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubs.slice(0, 10).map((s) => {
                      const bd = STATUS_BADGE[s.status] ?? { cls: "neutral", label: s.status };
                      return (
                        <tr key={s.id}>
                          <td style={{ fontSize: 13 }}>{s.user.email ?? "—"}</td>
                          <td>
                            <strong>{s.plan.name}</strong>
                            <div className="admin-cell-muted">{s.plan.code}</div>
                          </td>
                          <td><span className={`admin-badge ${bd.cls}`}>{bd.label}</span></td>
                          <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>
                            {new Date(s.startsAt).toLocaleDateString()} → {new Date(s.endsAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                    {activeSubs.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--admin-muted-2)", padding: 24 }}>No active subscriptions yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Subscriptions tab ── */}
      {tab === "subscriptions" && (
        <>
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <IconSearch style={{ width: 15, height: 15 }} />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Search by email or plan…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
            <span className="admin-chip">{filteredSubs.length} rows</span>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={8} cols={4} />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Starts</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((s) => {
                    const bd = STATUS_BADGE[s.status] ?? { cls: "neutral", label: s.status };
                    const expired = new Date(s.endsAt) < new Date();
                    return (
                      <tr key={s.id}>
                        <td style={{ fontSize: 13 }}>{s.user.email ?? "—"}</td>
                        <td>
                          <strong>{s.plan.name}</strong>
                          <div className="admin-cell-muted">{s.plan.code}</div>
                        </td>
                        <td><span className={`admin-badge ${bd.cls}`}>{bd.label}</span></td>
                        <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>
                          {new Date(s.startsAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: 12, color: expired ? "var(--admin-danger)" : "var(--admin-muted)" }}>
                          {new Date(s.endsAt).toLocaleDateString()}
                          {expired && s.status === "ACTIVE" && (
                            <div className="admin-cell-muted" style={{ color: "var(--admin-danger)", fontSize: 11 }}>
                              Overdue
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSubs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--admin-muted-2)", padding: 28 }}>
                        No subscriptions match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="admin-meta" style={{ textAlign: "right", marginTop: 8 }}>
            Showing <strong>{filteredSubs.length}</strong> of <strong>{subs.length}</strong> subscriptions
          </p>
        </>
      )}
    </div>
  );
}
