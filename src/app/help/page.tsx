"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type HelpPayload = {
  supportEmail: string;
  faqs: { q: string; a: string }[];
};

export default function PublicHelpPage() {
  const [content, setContent] = useState<HelpPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApiJson<HelpPayload>("/help")
      .then(setContent)
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <main style={{ padding: 40, maxWidth: 640, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: "1.75rem" }}>Help &amp; support</h1>
      {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}
      {content ? (
        <>
          <p>
            Contact:{" "}
            <a href={`mailto:${content.supportEmail}`}>{content.supportEmail}</a>
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {content.faqs.map((f, i) => (
              <li
                key={i}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <strong>{f.q}</strong>
                <p style={{ color: "#555", margin: "8px 0 0" }}>{f.a}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/">Home</Link>
        {" · "}
        <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
