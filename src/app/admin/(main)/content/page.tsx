"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeleton";
import { adminFetch, adminJson } from "@/lib/admin/fetch";
import {
  IconBell,
  IconCheck,
  IconEdit,
  IconMegaphone,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX
} from "@/components/admin/AdminIcons";

type Pack = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  _count: { stickers: number };
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type ContentTab = "announcements" | "stickers";

function AnnouncementModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (title: string, body: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    await onSave(title.trim(), body.trim());
    setSaving(false);
    onClose();
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal-head">
          <div>
            <h2 className="admin-modal-title">New announcement</h2>
            <p className="admin-modal-sub">Published immediately to all members in the app feed.</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <IconX style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="admin-label" htmlFor="ann-title">Title</label>
          <input
            id="ann-title"
            className="admin-input"
            style={{ maxWidth: "100%" }}
            placeholder="e.g. Valentine's week promotion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: "var(--admin-muted-2)", marginTop: -12, marginBottom: 14 }}>
            {title.length}/120
          </div>

          <label className="admin-label" htmlFor="ann-body">Message body</label>
          <textarea
            id="ann-body"
            className="admin-textarea"
            style={{ width: "100%", minHeight: 120 }}
            placeholder="Message shown in the app feed to all members…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={800}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: "var(--admin-muted-2)", marginTop: -12, marginBottom: 14 }}>
            {body.length}/800
          </div>

          <div className="admin-modal-footer" style={{ paddingTop: 0, borderTop: "none" }}>
            <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn primary" disabled={saving || !title.trim() || !body.trim()}>
              <IconBell style={{ width: 14, height: 14 }} />
              {saving ? "Publishing…" : "Publish announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContentTab>("announcements");
  const [showNewAnn, setShowNewAnn] = useState(false);
  const [preview, setPreview] = useState<Announcement | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminJson<{ items: Pack[] }>("/admin/sticker-packs"),
      adminJson<{ items: Announcement[] }>("/admin/announcements")
    ])
      .then(([p, a]) => {
        setPacks(p.items);
        setAnnouncements(a.items);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePack(id: string, isActive: boolean) {
    const res = await adminFetch(`/admin/sticker-packs/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: { message?: string } }).error?.message ?? "Failed");
      return;
    }
    load();
  }

  async function saveAnnouncement(title: string, body: string) {
    const res = await adminFetch("/admin/announcements", {
      method: "POST",
      body: JSON.stringify({ title, body })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: { message?: string } }).error?.message ?? "Failed");
      return;
    }
    load();
  }

  if (err) {
    return (
      <div>
        <AdminPageHeader title="Content" description="Sticker packs and in-app announcements." />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  return (
    <div>
      {showNewAnn && (
        <AnnouncementModal
          onClose={() => setShowNewAnn(false)}
          onSave={saveAnnouncement}
        />
      )}

      {preview && (
        <div className="admin-modal-overlay" onClick={() => setPreview(null)}>
          <div className="admin-modal">
            <div className="admin-modal-head">
              <div>
                <h2 className="admin-modal-title">{preview.title}</h2>
                <p className="admin-modal-sub">
                  Published {new Date(preview.createdAt).toLocaleString()}
                </p>
              </div>
              <button className="admin-modal-close" onClick={() => setPreview(null)}>
                <IconX style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <p style={{ lineHeight: 1.7, color: "var(--admin-text)", whiteSpace: "pre-wrap" }}>{preview.body}</p>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <AdminPageHeader
        title="Content"
        description="Manage in-app announcements and sticker pack visibility for members."
        actions={
          <>
            <button className="admin-btn ghost" onClick={load} disabled={loading}>
              <IconRefresh style={{ width: 14, height: 14 }} />
              Refresh
            </button>
            {tab === "announcements" && (
              <button className="admin-btn primary" onClick={() => setShowNewAnn(true)}>
                <IconPlus style={{ width: 14, height: 14 }} />
                New announcement
              </button>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div className="admin-tab-row" style={{ marginBottom: 24, display: "inline-flex" }}>
        <button
          className={`admin-tab ${tab === "announcements" ? "active" : ""}`}
          onClick={() => setTab("announcements")}
        >
          <IconMegaphone style={{ width: 13, height: 13 }} />
          Announcements
          {announcements.length > 0 && <span style={{ marginLeft: 5, opacity: 0.7 }}>({announcements.length})</span>}
        </button>
        <button
          className={`admin-tab ${tab === "stickers" ? "active" : ""}`}
          onClick={() => setTab("stickers")}
        >
          <IconPackage style={{ width: 13, height: 13 }} />
          Sticker packs
          {packs.length > 0 && <span style={{ marginLeft: 5, opacity: 0.7 }}>({packs.length})</span>}
        </button>
      </div>

      {/* ── Announcements tab ── */}
      {tab === "announcements" && (
        <>
          {/* Stats row */}
          <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
            <div className="admin-stat admin-stat--purple">
              <label>Total published</label>
              <strong>{announcements.length}</strong>
            </div>
            <div className="admin-stat admin-stat--mint">
              <label>This week</label>
              <strong>
                {announcements.filter((a) => {
                  const d = new Date(a.createdAt);
                  const week = new Date();
                  week.setDate(week.getDate() - 7);
                  return d >= week;
                }).length}
              </strong>
            </div>
            <div className="admin-stat admin-stat--rose">
              <label>This month</label>
              <strong>
                {announcements.filter((a) => {
                  const d = new Date(a.createdAt);
                  return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                }).length}
              </strong>
            </div>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={5} cols={3} />
          ) : announcements.length === 0 ? (
            <div className="admin-empty">
              <div style={{ marginBottom: 12 }}>
                <IconMegaphone style={{ width: 36, height: 36, color: "var(--admin-muted-2)" }} />
              </div>
              <p className="admin-empty-title">No announcements yet</p>
              <p className="admin-empty-desc">Publish an announcement to notify all members in the app feed.</p>
              <div style={{ marginTop: 16 }}>
                <button className="admin-btn primary" onClick={() => setShowNewAnn(true)}>
                  <IconPlus style={{ width: 14, height: 14 }} />
                  Create first announcement
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title &amp; preview</th>
                    <th>Published</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{a.title}</div>
                        <div className="admin-cell-muted" style={{ maxWidth: 480, marginTop: 4, lineHeight: 1.5 }}>
                          {a.body.slice(0, 140)}{a.body.length > 140 ? "…" : ""}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--admin-muted)", whiteSpace: "nowrap" }}>
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className="admin-btn-icon"
                            title="Preview"
                            onClick={() => setPreview(a)}
                          >
                            <IconEdit style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Sticker packs tab ── */}
      {tab === "stickers" && (
        <>
          <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
            <div className="admin-stat admin-stat--purple">
              <label>Total packs</label>
              <strong>{packs.length}</strong>
            </div>
            <div className="admin-stat admin-stat--mint">
              <label>Active packs</label>
              <strong>{packs.filter((p) => p.isActive).length}</strong>
            </div>
            <div className="admin-stat admin-stat--amber">
              <label>Total stickers</label>
              <strong>{packs.reduce((s, p) => s + p._count.stickers, 0)}</strong>
            </div>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={4} cols={4} />
          ) : packs.length === 0 ? (
            <div className="admin-empty">
              <div style={{ marginBottom: 12 }}>
                <IconPackage style={{ width: 36, height: 36, color: "var(--admin-muted-2)" }} />
              </div>
              <p className="admin-empty-title">No sticker packs found</p>
              <p className="admin-empty-desc">Sticker packs are seeded via database migration.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pack name</th>
                    <th>Slug</th>
                    <th>Stickers</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packs.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "var(--admin-primary-soft)",
                            display: "grid", placeItems: "center",
                            color: "var(--admin-primary)", fontSize: 18
                          }}>
                            <IconPackage style={{ width: 18, height: 18 }} />
                          </div>
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--admin-muted)" }}>{p.slug}</td>
                      <td>
                        <span className="admin-badge neutral">{p._count.stickers}</span>
                      </td>
                      <td>
                        {p.isActive
                          ? <span className="admin-badge ok"><IconCheck style={{ width: 10, height: 10 }} /> Active</span>
                          : <span className="admin-badge neutral">Inactive</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className={`admin-btn sm ${p.isActive ? "danger" : ""}`}
                            style={{ minWidth: 90 }}
                            onClick={() => togglePack(p.id, !p.isActive)}
                          >
                            {p.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
