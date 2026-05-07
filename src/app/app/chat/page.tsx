"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type ChatListRow = {
  userId: string;
  chat: {
    id: string;
    match: { userAId: string; userBId: string };
    messages: { body: string | null; createdAt: string }[];
  };
};

export default function ChatListPage() {
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<ChatListRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await userApiJson<{ userId: string }>("/users/me");
        setMyId(me.userId);
        const data = await userApiJson<{ items: ChatListRow[] }>("/chat/list");
        setRows(data.items);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Could not load chats");
      }
    })();
  }, []);

  return (
    <>
      <h1 className="member-title">Chat</h1>
      <p className="member-sub">Open a thread to read and send messages.</p>
      {err ? <p className="member-error">{err}</p> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {myId &&
          rows.map((row) => {
            const { userAId, userBId } = row.chat.match;
            const other = userAId === row.userId ? userBId : userAId;
            const preview = row.chat.messages[0]?.body ?? "No messages yet";
            return (
              <li key={row.chat.id} className="member-card" style={{ maxWidth: 520 }}>
                <Link href={`/app/chat/${row.chat.id}`} style={{ color: "var(--app-accent)" }}>
                  Chat with {other.slice(0, 8)}…
                </Link>
                <p className="member-muted" style={{ margin: "8px 0 0" }}>
                  {preview}
                </p>
              </li>
            );
          })}
      </ul>
      {rows.length === 0 && myId ? (
        <p className="member-muted">No chats yet. Match someone first.</p>
      ) : null}
      <p style={{ marginTop: 16 }}>
        <Link href="/app/matches">← Matches</Link>
      </p>
    </>
  );
}
