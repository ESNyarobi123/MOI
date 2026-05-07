"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type MatchRow = {
  id: string;
  userAId: string;
  userBId: string;
  matchedAt: string;
  chat: { id: string } | null;
};

export default function MatchesPage() {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [items, setItems] = useState<MatchRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setErr(null);
    try {
      const me = await userApiJson<{ userId: string }>("/users/me");
      setMyId(me.userId);
      const data = await userApiJson<{ items: MatchRow[] }>("/matching/matches");
      setItems(data.items);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load matches");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function openChat(otherUserId: string, existingChatId?: string | null) {
    if (existingChatId) {
      router.push(`/app/chat/${existingChatId}`);
      return;
    }
    try {
      const chat = await userApiJson<{ id: string }>("/chat/start", {
        method: "POST",
        body: JSON.stringify({ otherUserId })
      });
      router.push(`/app/chat/${chat.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not open chat");
    }
  }

  return (
    <>
      <h1 className="member-title">Matches</h1>
      <p className="member-sub">People you matched with. Start a chat anytime.</p>
      {err ? <p className="member-error">{err}</p> : null}
      <button type="button" className="member-btn" style={{ marginBottom: 16 }} onClick={refresh}>
        Refresh
      </button>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {myId &&
          items.map((m) => {
            const other = m.userAId === myId ? m.userBId : m.userAId;
            return (
              <li key={m.id} className="member-card" style={{ maxWidth: 480 }}>
                <strong>Match</strong>
                <p className="member-muted" style={{ margin: "6px 0" }}>
                  User ID: {other.slice(0, 8)}… ·{" "}
                  {new Date(m.matchedAt).toLocaleString()}
                </p>
                <button
                  type="button"
                  className="member-btn primary"
                  onClick={() => openChat(other, m.chat?.id)}
                >
                  Chat
                </button>
              </li>
            );
          })}
      </ul>
      {items.length === 0 && myId ? (
        <p className="member-muted">No matches yet. Try Discover.</p>
      ) : null}
      <p style={{ marginTop: 16 }}>
        <Link href="/app/discover">← Discover</Link>
      </p>
    </>
  );
}
