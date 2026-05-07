"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { adminFetch, adminJson } from "@/lib/admin/fetch";
import {
  IconDownload,
  IconEye,
  IconFlag,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrash,
  IconTrendingUp,
  IconUsers,
  IconX
} from "@/components/admin/AdminIcons";

type AdminUser = {
  id: string;
  email: string | null;
  isSuspended: boolean;
  isBanned: boolean;
  fakeAccountFlag: boolean;
  accountRiskNote: string | null;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  profile: { fullName: string; city: string; gender?: string; age?: number } | null;
};

type FilterTab = "all" | "active" | "suspended" | "banned" | "flagged";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "??";
}

function UserDetailModal({ user, onClose, onAction }: {
  user: AdminUser;
  onClose: () => void;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(user.accountRiskNote ?? "");

  async function doSuspend(suspend: boolean) {
    setLoading(true);
    await adminFetch("/admin/users/suspend", {
      method: "POST",
      body: JSON.stringify({ userId: user.id, suspend })
    }).catch(() => null);
    setLoading(false);
    onAction();
    onClose();
  }

  async function doBan(ban: boolean) {
    setLoading(true);
    await adminFetch("/admin/users/ban", {
      method: "POST",
      body: JSON.stringify({ userId: user.id, ban })
    }).catch(() => null);
    setLoading(false);
    onAction();
    onClose();
  }

  async function saveNote() {
    setLoading(true);
    await adminFetch(`/admin/users/${user.id}/flags`, {
      method: "PATCH",
      body: JSON.stringify({ accountRiskNote: note, fakeAccountFlag: user.fakeAccountFlag })
    }).catch(() => null);
    setLoading(false);
    onAction();
  }

  async function toggleFake() {
    setLoading(true);
    await adminFetch(`/admin/users/${user.id}/flags`, {
      method: "PATCH",
      body: JSON.stringify({ fakeAccountFlag: !user.fakeAccountFlag, accountRiskNote: note || null })
    }).catch(() => null);
    setLoading(false);
    onAction();
    onClose();
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal admin-modal-lg">
        {/* Header */}
        <div className="admin-modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="admin-avatar admin-avatar lg" style={{ fontSize: 18 }}>
              {initials(user.profile?.fullName ?? user.email ?? "?")}
            </div>
            <div>
              <h2 className="admin-modal-title">{user.profile?.fullName ?? "Unknown"}</h2>
              <p className="admin-modal-sub">{user.email} · {user.profile?.city ?? "—"}</p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <IconX style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {user.isBanned     && <span className="admin-badge bad">Banned</span>}
          {user.isSuspended  && <span className="admin-badge warn">Suspended</span>}
          {user.fakeAccountFlag && <span className="admin-badge warn">Fake Flag</span>}
          {!user.isBanned && !user.isSuspended && !user.fakeAccountFlag && (
            <span className="admin-badge ok">Active &amp; clean</span>
          )}
          {user.role === "ADMIN" && <span className="admin-badge purple">Admin</span>}
        </div>

        {/* Details */}
        <div>
          {[
            ["User ID",  user.id],
            ["Email",    user.email ?? "—"],
            ["Name",     user.profile?.fullName ?? "—"],
            ["City",     user.profile?.city ?? "—"],
            ["Gender",   user.profile?.gender ?? "—"],
            ["Age",      user.profile?.age ? String(user.profile.age) : "—"],
            ["Joined",   user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"],
            ["Status",   user.isBanned ? "Banned" : user.isSuspended ? "Suspended" : "Active"],
          ].map(([k, v]) => (
            <div className="admin-kv" key={k}>
              <span className="admin-kv-key">{k}</span>
              <span className="admin-kv-val" style={{ fontFamily: k === "User ID" ? "monospace" : undefined, fontSize: k === "User ID" ? 12 : undefined }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Risk note */}
        <div style={{ marginTop: 18 }}>
          <label className="admin-label" htmlFor="risk-note">Investigation / risk note</label>
          <textarea
            id="risk-note"
            className="admin-textarea"
            style={{ width: "100%", minHeight: 72, marginBottom: 8 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note visible to admins only…"
          />
          <button className="admin-btn sm" onClick={saveNote} disabled={loading}>
            Save note
          </button>
        </div>

        {/* Actions */}
        <div className="admin-modal-footer">
          <button className="admin-btn danger sm" onClick={() => toggleFake()} disabled={loading}>
            <IconFlag style={{ width: 14, height: 14 }} />
            {user.fakeAccountFlag ? "Remove fake flag" : "Flag as fake"}
          </button>
          {!user.isBanned && (
            <>
              <button className="admin-btn sm" onClick={() => doSuspend(!user.isSuspended)} disabled={loading}>
                <IconShield style={{ width: 14, height: 14 }} />
                {user.isSuspended ? "Unsuspend" : "Suspend"}
              </button>
              <button className="admin-btn danger sm" onClick={() => doBan(true)} disabled={loading}>
                <IconTrash style={{ width: 14, height: 14 }} />
                Ban account
              </button>
            </>
          )}
          {user.isBanned && (
            <button className="admin-btn sm" onClick={() => doBan(false)} disabled={loading}>
              Unban account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminJson<{ items: AdminUser[] }>("/admin/users?limit=500")
      .then((d) => setItems(d.items))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "active")    list = list.filter((u) => !u.isBanned && !u.isSuspended && !u.fakeAccountFlag);
    if (filter === "suspended") list = list.filter((u) => u.isSuspended && !u.isBanned);
    if (filter === "banned")    list = list.filter((u) => u.isBanned);
    if (filter === "flagged")   list = list.filter((u) => u.fakeAccountFlag);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        (u.email?.toLowerCase() ?? "").includes(q) ||
        (u.profile?.fullName?.toLowerCase() ?? "").includes(q) ||
        (u.profile?.city?.toLowerCase() ?? "").includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  const counts = useMemo(() => ({
    all:       items.length,
    active:    items.filter((u) => !u.isBanned && !u.isSuspended && !u.fakeAccountFlag).length,
    suspended: items.filter((u) => u.isSuspended && !u.isBanned).length,
    banned:    items.filter((u) => u.isBanned).length,
    flagged:   items.filter((u) => u.fakeAccountFlag).length,
  }), [items]);

  function exportCsv() {
    const rows = [["ID","Email","Name","City","Status","Fake Flag"]];
    filtered.forEach((u) => rows.push([
      u.id, u.email ?? "", u.profile?.fullName ?? "", u.profile?.city ?? "",
      u.isBanned ? "banned" : u.isSuspended ? "suspended" : "active",
      String(u.fakeAccountFlag)
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `moidate-users-${Date.now()}.csv`;
    a.click();
  }

  if (err) {
    return (
      <div>
        <AdminPageHeader title="Users" description="Member account management." />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div>
      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onAction={load}
        />
      )}

      <AdminPageHeader
        title="Users"
        description="Search, filter, view, and take actions on member accounts."
        meta={`${items.length.toLocaleString()} total members`}
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={exportCsv}>
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

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", marginBottom: 20 }}>
        <div className="admin-stat admin-stat--purple">
          <label>Total members</label>
          <strong>{counts.all}</strong>
        </div>
        <div className="admin-stat admin-stat--mint">
          <label>Active</label>
          <strong>{counts.active}</strong>
          <div className="admin-stat-trend up">
            <IconTrendingUp style={{ width: 12, height: 12 }} />
            healthy
          </div>
        </div>
        <div className="admin-stat admin-stat--amber">
          <label>Suspended</label>
          <strong>{counts.suspended}</strong>
        </div>
        <div className="admin-stat admin-stat--alert">
          <label>Banned</label>
          <strong>{counts.banned}</strong>
        </div>
        <div className="admin-stat admin-stat--rose">
          <label>Flagged</label>
          <strong>{counts.flagged}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <IconSearch style={{ width: 15, height: 15 }} />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by name, email, or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-tab-row">
          {(["all","active","suspended","banned","flagged"] as FilterTab[]).map((t) => (
            <button
              key={t}
              className={`admin-tab ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {counts[t] > 0 && <span style={{ marginLeft: 5, opacity: 0.7 }}>({counts[t]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <AdminTableSkeleton rows={10} cols={5} />
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">
            <IconUsers style={{ width: 32, height: 32, color: "var(--admin-muted-2)" }} />
          </div>
          <p className="admin-empty-title">No users found</p>
          <p className="admin-empty-desc">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="admin-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {initials(u.profile?.fullName ?? u.email ?? "?")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                          {u.profile?.fullName ?? "—"}
                        </div>
                        <div className="admin-cell-muted">{u.profile?.city ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{u.email ?? "—"}</td>
                  <td>
                    {u.isBanned     ? <span className="admin-badge bad">Banned</span>
                    : u.isSuspended ? <span className="admin-badge warn">Suspended</span>
                    :                  <span className="admin-badge ok">Active</span>}
                  </td>
                  <td>
                    {u.fakeAccountFlag
                      ? <span className="admin-badge warn">Fake flag</span>
                      : <span className="admin-badge ok" style={{ background: "transparent", border: "1px solid var(--admin-border)", color: "var(--admin-muted-2)" }}>Clean</span>}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--admin-muted-2)" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        className="admin-btn-icon"
                        title="View / Edit"
                        onClick={() => setSelected(u)}
                      >
                        <IconEye style={{ width: 14, height: 14 }} />
                      </button>
                      {!u.isBanned && (
                        <button
                          className="admin-btn-icon"
                          title={u.isSuspended ? "Unsuspend" : "Suspend"}
                          onClick={async () => {
                            await adminFetch("/admin/users/suspend", {
                              method: "POST",
                              body: JSON.stringify({ userId: u.id, suspend: !u.isSuspended })
                            });
                            load();
                          }}
                        >
                          <IconShield style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      <button
                        className={`admin-btn-icon ${!u.isBanned ? "danger" : ""}`}
                        title={u.isBanned ? "Unban" : "Ban"}
                        onClick={async () => {
                          await adminFetch("/admin/users/ban", {
                            method: "POST",
                            body: JSON.stringify({ userId: u.id, ban: !u.isBanned })
                          });
                          load();
                        }}
                      >
                        <IconTrash style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      {!loading && (
        <p className="admin-meta" style={{ textAlign: "right", marginTop: 8 }}>
          Showing <strong>{filtered.length}</strong> of <strong>{items.length}</strong> members
        </p>
      )}
    </div>
  );
}
