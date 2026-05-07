"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import "../app/app.css";
import { persistUserSession } from "@/lib/app/user-session";
import { userApiJson } from "@/lib/app/user-api";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await userApiJson<{
        accessToken: string;
        refreshToken: string;
      }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code })
      });
      persistUserSession(data.accessToken, data.refreshToken);
      router.replace("/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setLoading(true);
    try {
      await userApiJson("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="member-app" style={{ padding: 32, maxWidth: 440, margin: "0 auto" }}>
      <h1 className="member-title">Verify email</h1>
      <p className="member-sub">
        Enter the 6-digit code we sent. In development, check server logs for the
        code.
      </p>
      <form onSubmit={onSubmit} className="member-card" style={{ maxWidth: "none" }}>
        <label className="member-muted" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="member-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="member-muted" htmlFor="code">
          Code
        </label>
        <input
          id="code"
          className="member-input"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
        {error ? <p className="member-error">{error}</p> : null}
        <button type="submit" className="member-btn primary" disabled={loading}>
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
        <button type="button" className="member-btn" onClick={resend} disabled={loading}>
          Resend code
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        <Link href="/login">← Log in</Link>
      </p>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="member-app" style={{ padding: 32 }}>Loading…</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
