"use client";

import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Me = {
  userId: string;
  fullName: string;
  bio: string;
  city: string;
  country: string;
  interests: string[];
  lookingFor: string[];
  gender: string;
};

const LOOKING: { value: string; label: string }[] = [
  { value: "FRIENDSHIP", label: "Friendship" },
  { value: "DATING", label: "Dating" },
  { value: "SERIOUS_RELATIONSHIP", label: "Serious relationship" },
  { value: "MARRIAGE", label: "Marriage" }
];

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApiJson<Me>("/users/me")
      .then((m) => {
        setMe(m);
        setFullName(m.fullName);
        setBio(m.bio ?? "");
        setCity(m.city);
        setCountry(m.country);
        setInterestsText(m.interests.join(", "));
        setLookingFor(m.lookingFor ?? []);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      const interests = interestsText
        .split(",")
        .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean);
      if (lookingFor.length === 0) {
        setErr("Pick at least one “looking for” option.");
        return;
      }
      await userApiJson("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          bio,
          city,
          country
        })
      });
      const updated = await userApiJson<Me>("/users/preferences", {
        method: "PUT",
        body: JSON.stringify({ interests, lookingFor })
      });
      setMe(updated);
      setMsg("Profile saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (loading) return <p className="member-muted">Loading profile…</p>;
  if (!me && err) return <p className="member-error">{err}</p>;

  return (
    <>
      <h1 className="member-title">Profile</h1>
      <p className="member-sub">Update how others see you in Discover and matches.</p>
      <form onSubmit={save} className="member-card" style={{ maxWidth: 480 }}>
        <label className="member-muted">Full name</label>
        <input
          className="member-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <label className="member-muted">Bio</label>
        <textarea
          className="member-textarea"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <label className="member-muted">City</label>
        <input
          className="member-input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <label className="member-muted">Country</label>
        <input
          className="member-input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <label className="member-muted">Interests (comma-separated slugs, e.g. music, hiking)</label>
        <input
          className="member-input"
          value={interestsText}
          onChange={(e) => setInterestsText(e.target.value)}
        />
        <div className="member-muted" style={{ marginBottom: 8 }}>
          Looking for
        </div>
        {LOOKING.map(({ value, label }) => (
          <label key={value} style={{ display: "block", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={lookingFor.includes(value)}
              onChange={() => {
                setLookingFor((prev) =>
                  prev.includes(value)
                    ? prev.filter((v) => v !== value)
                    : [...prev, value]
                );
              }}
            />{" "}
            {label}
          </label>
        ))}
        {err ? <p className="member-error">{err}</p> : null}
        {msg ? <p className="member-ok">{msg}</p> : null}
        <button type="submit" className="member-btn primary">
          Save
        </button>
      </form>
    </>
  );
}
