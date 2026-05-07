"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import {
  IconDownload,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconTrendingUp,
  IconWallet
} from "@/components/admin/AdminIcons";
import { adminJson } from "@/lib/admin/fetch";

type Plan = {
  id: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  _count: { subscriptions: number };
};

export default function AdminPlansPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    setRefreshing(true);
    adminJson<{ items: Plan[] }>("/admin/subscription-plans")
      .then((d) => setItems(d.items))
      .catch((e: Error) => setErr(e.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.interval.toLowerCase().includes(q)
    );
  }, [items, search]);

  const totals = useMemo(() => {
    const totalSubs = items.reduce((s, p) => s + p._count.subscriptions, 0);
    const estMrrCents = items.reduce((s, p) => s + p.amount * p._count.subscriptions, 0);
    return {
      totalPlans: items.length,
      totalSubscriptions: totalSubs,
      estMrrUsd: estMrrCents / 100,
      avgPlanPriceUsd:
        items.length > 0 ? items.reduce((s, p) => s + p.amount, 0) / items.length / 100 : 0
    };
  }, [items]);

  function exportCsv() {
    const rows = [["Code", "Name", "Interval", "Price", "Currency", "Subscriptions"]];
    filtered.forEach((p) =>
      rows.push([
        p.code,
        p.name,
        p.interval,
        (p.amount / 100).toFixed(2),
        p.currency.toUpperCase(),
        String(p._count.subscriptions)
      ])
    );
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `moidate-plans-${Date.now()}.csv`;
    a.click();
  }

  if (err) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          title="Premium plans"
          description="Catalog synced from the database. Checkout flows are still deferred."
        />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Premium plans"
        description="Pricing catalog and subscription distribution across all premium tiers."
        meta={`${
          totals.totalSubscriptions
        } active subscriptions across ${totals.totalPlans} plans`}
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={exportCsv} disabled={loading}>
              <IconDownload style={{ width: 14, height: 14 }} />
              Export CSV
            </button>
            <button type="button" className="admin-btn ghost" onClick={load} disabled={refreshing}>
              <IconRefresh style={{ width: 14, height: 14 }} />
              Refresh
            </button>
          </>
        }
      />

      {!loading && (
        <div
          className="admin-stat-grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))", marginBottom: 20 }}
        >
          <div className="admin-stat admin-stat--purple">
            <label>Total plans</label>
            <strong>{totals.totalPlans}</strong>
          </div>
          <div className="admin-stat admin-stat--mint">
            <label>Active subscriptions</label>
            <strong>{totals.totalSubscriptions}</strong>
            <div className="admin-stat-trend up">
              <IconTrendingUp style={{ width: 12, height: 12 }} />
              growing base
            </div>
          </div>
          <div className="admin-stat admin-stat--rose">
            <label>Estimated MRR</label>
            <strong>${totals.estMrrUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
          </div>
          <div className="admin-stat admin-stat--amber">
            <label>Average price</label>
            <strong>${totals.avgPlanPriceUsd.toFixed(2)}</strong>
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <IconSearch style={{ width: 15, height: 15 }} />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by plan code, name, or interval…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="admin-chip">{filtered.length} visible</span>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={5} cols={4} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 18 }}>
          <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Code</th>
                  <th>Billing</th>
                  <th>Subscriptions</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const share =
                    totals.totalSubscriptions > 0
                      ? Math.round((p._count.subscriptions / totals.totalSubscriptions) * 100)
                      : 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: "var(--admin-primary-soft)",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--admin-primary)"
                            }}
                          >
                            <IconSparkles style={{ width: 14, height: 14 }} />
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{p.name}</div>
                            <div className="admin-cell-muted">{p.interval}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: 12, color: "var(--admin-muted)" }}>{p.code}</code>
                      </td>
                      <td>
                        <strong>${(p.amount / 100).toFixed(2)}</strong>{" "}
                        <span className="admin-cell-muted">{p.currency.toUpperCase()}</span>
                      </td>
                      <td>
                        <span className="admin-badge purple">{p._count.subscriptions}</span>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span className="admin-cell-muted">Adoption</span>
                          <strong style={{ color: "var(--admin-primary)" }}>{share}%</strong>
                        </div>
                        <div className="admin-progress">
                          <div className="admin-progress-fill" style={{ width: `${Math.min(share, 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--admin-muted-2)", padding: 26 }}>
                      No plans match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-panel" style={{ marginBottom: 0 }}>
            <div className="admin-panel-head">
              <span className="admin-panel-title">Pricing insights</span>
            </div>
            <div className="admin-feed">
              {items
                .slice()
                .sort((a, b) => b._count.subscriptions - a._count.subscriptions)
                .slice(0, 3)
                .map((p, idx) => (
                  <div key={p.id} className="admin-feed-item">
                    <div className={`admin-feed-dot ${idx === 0 ? "ok" : ""}`} />
                    <div className="admin-feed-body">
                      <strong>{p.name}</strong> leads with {p._count.subscriptions} active subscriptions.
                    </div>
                  </div>
                ))}
              {items.length > 0 && (
                <div className="admin-feed-item">
                  <div className="admin-feed-dot warn" />
                  <div className="admin-feed-body">
                    Consider A/B testing annual discount pricing to improve long-term retention.
                  </div>
                </div>
              )}
            </div>
            <div className="admin-divider" />
            <div style={{ fontSize: 12.5, color: "var(--admin-muted)" }}>
              <IconWallet style={{ width: 14, height: 14, verticalAlign: "middle", marginRight: 6 }} />
              Checkout integrations can be layered without changing this catalog schema.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
