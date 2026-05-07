"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Msg = {
  id: string;
  chatId: string;
  senderUserId: string;
  body: string | null;
  createdAt: string;
};

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const me = await userApiJson<{ userId: string }>("/users/me");
      setMyId(me.userId);
      const data = await userApiJson<{ items: Msg[] }>(
        `/chat/messages?chatId=${encodeURIComponent(chatId)}`
      );
      setMessages(data.items);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load messages");
    }
  }

  useEffect(() => {
    void load();
  }, [chatId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setErr(null);
    try {
      await userApiJson("/chat/messages/send", {
        method: "POST",
        body: JSON.stringify({
          chatId,
          type: "text",
          body: text.trim()
        })
      });
      setText("");
      await load();
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
      <p className="member-sub">Messages are moderated for safety.</p>
      {err ? <p className="member-error">{err}</p> : null}
      <div
        style={{
          border: "1px solid var(--app-border)",
          borderRadius: 12,
          padding: 16,
          maxWidth: 560,
          minHeight: 200,
          marginBottom: 16,
          background: "var(--app-surface)"
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
