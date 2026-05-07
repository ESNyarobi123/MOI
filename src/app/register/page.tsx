"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../app/app.css";
import { userApiJson } from "@/lib/app/user-api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await userApiJson<{ message: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          password,
          age: Number(age),
          gender
        })
      });
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="member-app" style={{ padding: 32, maxWidth: 440, margin: "0 auto" }}>
      <h1 className="member-title">Create account</h1>
      <p className="member-sub">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
      <form onSubmit={onSubmit} className="member-card" style={{ maxWidth: "none" }}>
        <label className="member-muted" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className="member-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
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
          Password (8+ characters)
        </label>
        <input
          id="password"
          className="member-input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <label className="member-muted" htmlFor="age">
          Age
        </label>
        <input
          id="age"
          className="member-input"
          type="number"
          min={18}
          max={120}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          required
        />
        <label className="member-muted" htmlFor="gender">
          Gender
        </label>
        <select
          id="gender"
          className="member-input"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non_binary">Non-binary</option>
          <option value="other">Other</option>
        </select>
        {error ? <p className="member-error">{error}</p> : null}
        <button type="submit" className="member-btn primary" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
