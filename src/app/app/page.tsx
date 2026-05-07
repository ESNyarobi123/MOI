"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

export default function AppHomePage() {
  const [announcements, setAnnouncements] = useState<
    { id: string; title: string; body: string; createdAt: string }[]
  >([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApiJson<{ items: typeof announcements }>("/announcements?limit=5")
      .then((d) => setAnnouncements(d.items))
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <>
      <h1 className="member-title">Welcome</h1>
      <p className="member-sub">
        Use the sidebar to discover people, manage matches, chat, and adjust
        safety and privacy.
      </p>
      <p className="member-muted" style={{ marginBottom: 24 }}>
        Tip: finish your profile and interests before opening Discover so the
        feed can rank you correctly.
      </p>
      <Link href="/app/discover" className="member-btn primary">
        Start discovering
      </Link>
      {err ? <p className="member-error">{err}</p> : null}
      {!err && announcements.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2 className="member-title" style={{ fontSize: "1.1rem" }}>
            News
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {announcements.map((a) => (
              <li key={a.id} className="member-card" style={{ maxWidth: 560 }}>
                <strong>{a.title}</strong>
                <p className="member-muted" style={{ margin: "8px 0 0" }}>
                  {a.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
