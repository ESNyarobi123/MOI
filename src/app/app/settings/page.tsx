"use client";

import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Me = {
  showProfile: boolean;
  hideExactLocation: boolean;
  distanceKm: number;
};

export default function SettingsPage() {
  const [showProfile, setShowProfile] = useState(true);
  const [hideExactLocation, setHideExactLocation] = useState(false);
  const [distanceKm, setDistanceKm] = useState(50);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApiJson<Me>("/users/me")
      .then((m) => {
        setShowProfile(m.showProfile);
        setHideExactLocation(m.hideExactLocation);
        setDistanceKm(m.distanceKm);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await userApiJson("/users/privacy", {
        method: "PUT",
        body: JSON.stringify({
          showProfile,
          hideExactLocation,
          distanceKm: Number(distanceKm)
        })
      });
      setMsg("Privacy settings saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <>
      <h1 className="member-title">Settings</h1>
      <p className="member-sub">Control profile visibility and discovery radius.</p>
      <form onSubmit={save} className="member-card" style={{ maxWidth: 440 }}>
        <label style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={showProfile}
            onChange={(e) => setShowProfile(e.target.checked)}
          />
          Show my profile in Discover
        </label>
        <label style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={hideExactLocation}
            onChange={(e) => setHideExactLocation(e.target.checked)}
          />
          Hide exact location
        </label>
        <label className="member-muted">Discovery radius (km)</label>
        <input
          className="member-input"
          type="number"
          min={5}
          max={200}
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
        />
        {err ? <p className="member-error">{err}</p> : null}
        {msg ? <p className="member-ok">{msg}</p> : null}
        <button type="submit" className="member-btn primary">
          Save
        </button>
      </form>
    </>
  );
}
