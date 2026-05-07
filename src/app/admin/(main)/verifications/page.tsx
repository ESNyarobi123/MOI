"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { IconBadgeCheck, IconRefresh, IconSearch, IconTrendingUp } from "@/components/admin/AdminIcons";
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { adminFetch, adminJson } from "@/lib/admin/fetch";

type Pending = {
  id: string;
  userId: string;
  idDocUrl: string | null;
  selfieUrl: string | null;
  createdAt: string;
  user: {
    email: string | null;
    profile: { fullName: string } | null;
  };
};

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminJson<{ items: Pending[] }>("/admin/verification/pending")
      .then((d) => setItems(d.items))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    const notes = window.prompt("Notes (optional):") ?? undefined;
    const res = await adminFetch(`/admin/verification/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ notes })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: { message?: string } }).error?.message || "Failed");
      return;
    }
    load();
  }

  async function reject(id: string) {
    const notes = window.prompt("Rejection notes:") ?? "";
    const res = await adminFetch(`/admin/verification/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ notes })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: { message?: string } }).error?.message || "Failed");
      return;
    }
    load();
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (r) =>
        (r.user.profile?.fullName?.toLowerCase() ?? "").includes(q) ||
        (r.user.email?.toLowerCase() ?? "").includes(q) ||
        r.userId.toLowerCase().includes(q)
    );
  }, [items, query]);

  if (err) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          title="Profile verifications"
          description="Review ID and selfie submissions before approving trust on profiles."
        />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Profile verifications"
        description="Review ID and selfie submissions before approving trust on profiles."
        meta={`${items.length} pending reviews`}
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
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))", marginBottom: 20 }}
        >
          <div className="admin-stat admin-stat--amber">
            <label>Pending queue</label>
            <strong>{items.length}</strong>
          </div>
          <div className="admin-stat admin-stat--mint">
            <label>Ready with both docs</label>
            <strong>{items.filter((i) => i.idDocUrl && i.selfieUrl).length}</strong>
            <div className="admin-stat-trend up">
              <IconTrendingUp style={{ width: 12, height: 12 }} />
              fast approvals
            </div>
          </div>
          <div className="admin-stat admin-stat--rose">
            <label>Missing one document</label>
            <strong>{items.filter((i) => !i.idDocUrl || !i.selfieUrl).length}</strong>
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <IconSearch style={{ width: 15, height: 15 }} />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by name, email, or user ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="admin-chip">{filtered.length} visible</span>
      </div>
      {loading ? (
        <AdminTableSkeleton rows={6} cols={4} />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={<IconBadgeCheck width={40} height={40} />}
          title="All caught up"
          description="There are no pending verification requests. New submissions will appear here."
        />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={<IconBadgeCheck width={40} height={40} />}
          title="No matching requests"
          description="Try a different search query."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 18 }}>
          <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Documents</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                        {r.user.profile?.fullName ?? "—"}
                      </div>
                      <div className="admin-cell-muted">{r.user.email}</div>
                      <div className="admin-cell-muted" style={{ fontSize: 11 }}>
                        User ID: {r.userId}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {r.idDocUrl ? (
                        <a className="admin-link" href={r.idDocUrl} target="_blank" rel="noreferrer">
                          ID doc
                        </a>
                      ) : (
                        <span className="admin-badge warn">No ID</span>
                      )}{" "}
                      {r.selfieUrl ? (
                        <a className="admin-link" href={r.selfieUrl} target="_blank" rel="noreferrer">
                          Selfie
                        </a>
                      ) : (
                        <span className="admin-badge warn">No selfie</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--admin-muted)" }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <button type="button" className="admin-btn primary" onClick={() => approve(r.id)}>
                        Approve
                      </button>
                      <button type="button" className="admin-btn danger" onClick={() => reject(r.id)}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-panel" style={{ marginBottom: 0 }}>
            <div className="admin-panel-head">
              <span className="admin-panel-title">Review guide</span>
            </div>
            <div className="admin-feed">
              <div className="admin-feed-item">
                <div className="admin-feed-dot ok" />
                <div className="admin-feed-body">
                  Approve requests where ID name and selfie clearly match profile owner.
                </div>
              </div>
              <div className="admin-feed-item">
                <div className="admin-feed-dot warn" />
                <div className="admin-feed-body">
                  Reject if document is blurred, cropped, or missing key details.
                </div>
              </div>
              <div className="admin-feed-item">
                <div className="admin-feed-dot danger" />
                <div className="admin-feed-body">
                  Flag suspicious repeated attempts for trust & safety follow-up.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
