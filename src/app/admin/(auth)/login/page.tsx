"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAdminToken } from "@/lib/admin/fetch";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@moidate.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Trim both email and password to handle copy-paste issues
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    console.log("[LOGIN UI] Submitting:", { email: cleanEmail, passwordLength: cleanPassword.length });

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": crypto.randomUUID()
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      // Log response status for debugging
      console.log("[LOGIN UI] Response status:", res.status);

      const json = (await res.json()) as {
        ok: boolean;
        data?: { accessToken: string };
        error?: { message?: string; code?: string };
      };

      console.log("[LOGIN UI] Response:", { ok: json.ok, errorCode: json.error?.code });

      if (!res.ok || !json.ok || !json.data?.accessToken) {
        throw new Error(json.error?.message || "Login failed");
      }

      setAdminToken(json.data.accessToken);
      router.replace("/admin/overview");
    } catch (err) {
      console.error("[LOGIN UI] Error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login admin-login-pro">
      <div className="admin-login-hero" aria-hidden={false}>
        <div className="admin-login-mesh" aria-hidden />
        <div className="admin-login-hero-inner">
          <div className="admin-login-brand-row">
            <Image src="/moidate.png" alt="MoiDate" width={44} height={44} className="admin-login-logo" priority />
            <span className="admin-login-badge">
              <span className="admin-login-badge-dot" aria-hidden />
              Operations console
            </span>
          </div>
          <h2 className="admin-login-hero-title">MoiDate platform control</h2>
          <p className="admin-login-hero-lead">
            A single secure entry for moderation, analytics, billing visibility, and member-safety
            workflows — built for teams running a production dating product.
          </p>
          <ul className="admin-login-features">
            <li>Live dashboards for users, matches, and engagement without exposing private chats.</li>
            <li>Trust &amp; safety tooling: reports, verifications, and account actions in one place.</li>
            <li>Role-gated access — only verified administrators reach this surface.</li>
          </ul>
        </div>
      </div>

      <div className="admin-login-form-wrap">
        <div className="admin-login-card admin-login-card--glass">
          <div className="admin-login-card-head">
            <p className="admin-eyebrow" style={{ marginBottom: 8 }}>
              Authenticate
            </p>
            <h1 className="admin-title">Sign in</h1>
            <p className="admin-sub">
              Use your <strong style={{ fontWeight: 600 }}>ADMIN</strong> credentials. Sessions are
              stored in this browser only.
            </p>
          </div>
          <form onSubmit={onSubmit}>
            <label className="admin-label" htmlFor="admin-email">
              Work email
            </label>
            <input
              id="admin-email"
              className="admin-input"
              style={{ maxWidth: "100%" }}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              className="admin-input"
              style={{ maxWidth: "100%" }}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
            {error ? <div className="admin-error">{error}</div> : null}
            <button
              type="submit"
              className="admin-btn primary"
              disabled={loading}
              style={{ marginTop: 12, width: "100%", maxWidth: "100%", padding: "14px 20px" }}
            >
              {loading ? "Authenticating…" : "Enter console"}
            </button>
          </form>
        </div>
        <p className="admin-login-foot">
          After database setup, the seeded operator is{" "}
          <code>admin@moidate.com</code> — change the password in production.
        </p>
      </div>
    </div>
  );
}
