"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../app/app.css";
import { persistUserSession } from "@/lib/app/user-session";
import { userApiJson } from "@/lib/app/user-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      persistUserSession(data.accessToken, data.refreshToken);
      router.replace("/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="member-app" style={{ padding: 32, maxWidth: 440, margin: "0 auto" }}>
      <h1 className="member-title">Log in</h1>
      <p className="member-sub">
        New here? <Link href="/register">Create an account</Link>
      </p>
      <form onSubmit={onSubmit} className="member-card" style={{ maxWidth: "none" }}>
        <label className="member-muted" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="member-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="member-muted" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="member-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="member-error">{error}</p> : null}
        <button type="submit" className="member-btn primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
