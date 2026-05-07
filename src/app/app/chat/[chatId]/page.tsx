"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { userApiJson } from "@/lib/app/user-api";
import {
  getMemberSocket,
  memberJoinChat,
  memberLeaveChat,
  type ChatMessageSocketPayload,
} from "@/lib/app/member-realtime";

type Msg = {
  id: string;
  chatId: string;
  senderUserId: string;
  body: string | null;
  createdAt: string;
};

type Thread = {
  items: Msg[];
  messages?: unknown[];
};

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [socketOk, setSocketOk] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const me = await userApiJson<{ userId: string }>("/users/me");
      setMyId(me.userId);
      const data = await userApiJson<Thread>(
        `/chat/messages?chatId=${encodeURIComponent(chatId)}`
      );
      setMessages(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load messages");
    }
  }, [chatId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!chatId || !myId) return;

    memberJoinChat(chatId);

    const onMsg = (payload: ChatMessageSocketPayload) => {
      if (payload.chatId !== chatId) return;
      const row: Msg = {
        id: payload.id,
        chatId: payload.chatId,
        senderUserId: payload.senderUserId,
        body: payload.body,
        createdAt: payload.createdAt,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, row];
      });
    };

    let cancelled = false;
    let active: import("socket.io-client").Socket | null = null;

    void getMemberSocket()
      .then((s) => {
        if (cancelled) return;
        active = s;
        setSocketOk(Boolean(s));
        s?.on("chat:message", onMsg);
      })
      .catch(() => {
        if (!cancelled) setSocketOk(false);
      });

    return () => {
      cancelled = true;
      memberLeaveChat(chatId);
      active?.off("chat:message", onMsg);
    };
  }, [chatId, myId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setErr(null);
    try {
      const created = await userApiJson<Msg>("/chat/messages/send", {
        method: "POST",
        body: JSON.stringify({
          chatId,
          type: "text",
          body: text.trim(),
        }),
      });
      setText("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Send failed");
    }
  }

  return (
    <>
      <button type="button" className="member-btn" onClick={() => router.push("/app/chat")}>
        ← All chats
      </button>
      <h1 className="member-title" style={{ marginTop: 16 }}>
        Thread
      </h1>
      <p className="member-sub">
        Messages update live when the realtime server is running (
        <code>npm run dev:full</code>). REST always works for send/receive after refresh.
        {socketOk === false ? (
          <span style={{ color: "var(--app-warn, #b45309)" }}>
            {" "}
            (Realtime not connected — check dev:full / deployment.)
          </span>
        ) : null}
      </p>
      {err ? <p className="member-error">{err}</p> : null}
      <div
        style={{
          border: "1px solid var(--app-border)",
          borderRadius: 12,
          padding: 16,
          maxWidth: 560,
          minHeight: 200,
          marginBottom: 16,
          background: "var(--app-surface)",
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 12 }}>
            <span className="member-muted" style={{ fontSize: 12 }}>
              {myId && m.senderUserId === myId ? "You" : "Them"} ·{" "}
              {new Date(m.createdAt).toLocaleString()}
            </span>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
      <form onSubmit={send} style={{ maxWidth: 560 }}>
        <textarea
          className="member-textarea"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button type="submit" className="member-btn primary">
          Send
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        <Link href="/app/safety">Safety center</Link>
      </p>
    </>
  );
}
