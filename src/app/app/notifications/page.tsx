"use client";

import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Row = {
  id: string;
  kind: string;
  title: string;
  body: string;
  refId: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await userApiJson<{ items: Row[] }>("/notifications?limit=50");
      setItems(data.items);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    try {
      await userApiJson(`/notifications/${id}/read`, { method: "POST" });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function markAll() {
    try {
      await userApiJson("/notifications/read-all", { method: "POST" });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <>
      <h1 className="member-title">Notifications</h1>
      <p className="member-sub">New matches and messages appear here.</p>
      <button type="button" className="member-btn" style={{ marginBottom: 16 }} onClick={markAll}>
        Mark all read
      </button>
      <button type="button" className="member-btn" onClick={load}>
        Refresh
      </button>
      {err ? <p className="member-error">{err}</p> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((n) => (
          <li
            key={n.id}
            className="member-card"
            style={{
              maxWidth: 560,
              opacity: n.readAt ? 0.65 : 1
            }}
          >
            <strong>{n.title}</strong>
            <span className="member-muted" style={{ marginLeft: 8, fontSize: 12 }}>
              {n.kind}
            </span>
            <p style={{ margin: "8px 0" }}>{n.body}</p>
            <p className="member-muted" style={{ fontSize: 12, margin: 0 }}>
              {new Date(n.createdAt).toLocaleString()}
            </p>
            {!n.readAt ? (
              <button
                type="button"
                className="member-btn"
                style={{ marginTop: 8 }}
                onClick={() => markRead(n.id)}
              >
                Mark read
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="member-muted">No notifications.</p> : null}
    </>
  );
}
