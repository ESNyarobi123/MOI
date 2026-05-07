"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { IconFlag, IconRefresh, IconSearch, IconTrendingUp } from "@/components/admin/AdminIcons";
import { adminFetch, adminJson } from "@/lib/admin/fetch";

const STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"] as const;

type ReportRow = {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
};

function statusBadge(status: string) {
  if (status === "OPEN") return <span className="admin-badge warn">{status}</span>;
  if (status === "RESOLVED") return <span className="admin-badge ok">{status}</span>;
  if (status === "REJECTED") return <span className="admin-badge neutral">{status}</span>;
  return <span className="admin-badge neutral">{status}</span>;
}

export default function AdminReportsPage() {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const load = useCallback(() => {
    setLoading(true);
    adminJson<{ items: ReportRow[] }>("/admin/reports")
      .then((d) => setItems(d.items))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const res = await adminFetch(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: { message?: string } }).error?.message || "Failed");
      return;
    }
    load();
  }

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          r.targetType.toLowerCase().includes(q) ||
          r.targetId.toLowerCase().includes(q) ||
          r.reporterUserId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, query, statusFilter]);

  const stats = useMemo(() => {
    const open = items.filter((r) => r.status === "OPEN").length;
    const inReview = items.filter((r) => r.status === "IN_REVIEW").length;
    const resolved = items.filter((r) => r.status === "RESOLVED").length;
    const rejected = items.filter((r) => r.status === "REJECTED").length;
    return { open, inReview, resolved, rejected, total: items.length };
  }, [items]);

  if (err) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          title="Safety reports"
          description="Triage user and message reports. Target IDs are opaque references."
        />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Safety reports"
        description="Triage user and message reports. Target IDs are opaque references."
        meta={`${stats.total} reports · ${stats.open} open`}
        actions={
          <button type="button" className="admin-btn ghost" onClick={load} disabled={loading}>
            <IconRefresh style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        }
      />

      {!loading && (
        <div
          className="admin-stat-grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", marginBottom: 20 }}
        >
          <div className="admin-stat admin-stat--alert">
            <label>Open</label>
            <strong>{stats.open}</strong>
          </div>
          <div className="admin-stat admin-stat--amber">
            <label>In review</label>
            <strong>{stats.inReview}</strong>
          </div>
          <div className="admin-stat admin-stat--mint">
            <label>Resolved</label>
            <strong>{stats.resolved}</strong>
            <div className="admin-stat-trend up">
              <IconTrendingUp style={{ width: 12, height: 12 }} />
              throughput
            </div>
          </div>
          <div className="admin-stat admin-stat--purple">
            <label>Rejected</label>
            <strong>{stats.rejected}</strong>
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <IconSearch style={{ width: 15, height: 15 }} />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search reason, type, target ID, reporter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="admin-chip">{filtered.length} visible</span>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={6} cols={5} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 18 }}>
          <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: "var(--admin-primary-soft)",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--admin-primary)"
                          }}
                        >
                          <IconFlag style={{ width: 13, height: 13 }} />
                        </span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.targetType}</div>
                          <div className="admin-cell-muted" style={{ fontSize: 11 }}>
                            {r.targetId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ color: "var(--admin-text)", fontSize: 13.5 }}>{r.reason}</div>
                      <div className="admin-cell-muted" style={{ fontSize: 11, marginTop: 4 }}>
                        Reporter: {r.reporterUserId}
                      </div>
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ fontSize: 12.5, color: "var(--admin-muted)" }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <select
                        className="admin-select"
                        style={{ minWidth: 140 }}
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                        aria-label={`Status for report ${r.id}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--admin-muted-2)", padding: 26 }}>
                      No reports match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-panel" style={{ marginBottom: 0 }}>
            <div className="admin-panel-head">
              <span className="admin-panel-title">Moderation queue insights</span>
            </div>
            <div className="admin-feed">
              <div className="admin-feed-item">
                <div className="admin-feed-dot danger" />
                <div className="admin-feed-body">
                  <strong>{stats.open}</strong> reports waiting to be triaged.
                </div>
              </div>
              <div className="admin-feed-item">
                <div className="admin-feed-dot warn" />
                <div className="admin-feed-body">
                  <strong>{stats.inReview}</strong> reports currently under investigation.
                </div>
              </div>
              <div className="admin-feed-item">
                <div className="admin-feed-dot ok" />
                <div className="admin-feed-body">
                  <strong>{stats.resolved}</strong> reports resolved by the moderation team.
                </div>
              </div>
            </div>
            <div className="admin-divider" />
            <p style={{ fontSize: 12.5, color: "var(--admin-muted)", margin: 0 }}>
              Tip: prioritize <strong style={{ color: "var(--admin-text)" }}>OPEN</strong> reports older than 24h to
              keep trust and safety SLAs healthy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
