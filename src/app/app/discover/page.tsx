"use client";

import { useCallback, useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Candidate = {
  userId: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  compatibilityScore: number;
  distanceKm: number | null;
};

export default function DiscoverPage() {
  const [current, setCurrent] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await userApiJson<{ items: Candidate[] }>(
        "/matching/feed?countrywide=true"
      );
      setCurrent(data.items[0] ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load feed");
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  async function swipe(action: "like" | "pass" | "superlike") {
    if (!current) return;
    setErr(null);
    setToast(null);
    try {
      const res = await userApiJson<{ isMatch: boolean }>("/matching/swipe", {
        method: "POST",
        body: JSON.stringify({ targetUserId: current.userId, action })
      });
      if (res.isMatch) setToast("It’s a match! Open Matches or Chat.");
      await loadFeed();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Swipe failed");
    }
  }

  return (
    <>
      <h1 className="member-title">Discover</h1>
      <p className="member-sub">Countrywide feed. Pass, like, or superlike.</p>
      {loading && !current ? <p className="member-muted">Loading…</p> : null}
      {err ? <p className="member-error">{err}</p> : null}
      {toast ? <p className="member-ok">{toast}</p> : null}
      {current ? (
        <div className="member-card" style={{ maxWidth: 400 }}>
          <h2 style={{ margin: "0 0 8px" }}>{current.fullName}</h2>
          <p className="member-muted">
            {current.age} · {current.city}, {current.country}
            {current.distanceKm != null
              ? ` · ~${Math.round(current.distanceKm)} km`
              : ""}
          </p>
          <p className="member-muted">Score: {current.compatibilityScore.toFixed(2)}</p>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="member-btn" onClick={() => swipe("pass")}>
              Pass
            </button>
            <button type="button" className="member-btn primary" onClick={() => swipe("like")}>
              Like
            </button>
            <button type="button" className="member-btn" onClick={() => swipe("superlike")}>
              Superlike
            </button>
          </div>
        </div>
      ) : !loading ? (
        <p className="member-muted">No more profiles right now. Check back later.</p>
      ) : null}
      <button type="button" className="member-btn" style={{ marginTop: 16 }} onClick={loadFeed}>
        Refresh feed
      </button>
    </>
  );
}
