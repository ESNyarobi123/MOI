"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type HelpPayload = {
  supportEmail: string;
  faqs: { q: string; a: string }[];
};

export default function HelpPage() {
  const [content, setContent] = useState<HelpPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApiJson<HelpPayload>("/help")
      .then(setContent)
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <>
      <h1 className="member-title">Help &amp; support</h1>
      <p className="member-sub">
        Answers to common questions. For billing or safety escalations, email support.
      </p>
      {err ? <p className="member-error">{err}</p> : null}
      {content ? (
        <>
          <p>
            Email:{" "}
            <a href={`mailto:${content.supportEmail}`} style={{ color: "var(--app-accent)" }}>
              {content.supportEmail}
            </a>
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {content.faqs.map((f, i) => (
              <li key={i} className="member-card" style={{ maxWidth: 560 }}>
                <strong>{f.q}</strong>
                <p className="member-muted" style={{ margin: "8px 0 0" }}>
                  {f.a}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/app/safety">Safety center</Link>
      </p>
    </>
  );
}
