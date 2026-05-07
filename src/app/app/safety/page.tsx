"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Plan = {
  id: string;
  contactPhone: string;
  dateLocation: string;
  startTime: string;
  endTime: string | null;
  isShared: boolean;
};

export default function SafetyPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [blockedUserId, setBlockedUserId] = useState("");
  const [reportUserId, setReportUserId] = useState("");
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApiJson<{ items: Plan[] }>("/safety/emergency-plan")
      .then((d) => setPlans(d.items))
      .catch(() => setPlans([]));
  }, []);

  async function blockUser(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await userApiJson("/safety/block", {
        method: "POST",
        body: JSON.stringify({ blockedUserId, reason: "user_request" })
      });
      setMsg("User blocked.");
      setBlockedUserId("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Block failed");
    }
  }

  async function reportUser(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await userApiJson("/safety/report", {
        method: "POST",
        body: JSON.stringify({
          targetUserId: reportUserId,
          reason: reportReason,
          details: reportDetails || undefined
        })
      });
      setMsg("Report submitted. Thank you.");
      setReportUserId("");
      setReportDetails("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Report failed");
    }
  }

  return (
    <>
      <h1 className="member-title">Safety center</h1>
      <p className="member-sub">
        Block, report, and manage date safety plans. For emergencies call local emergency
        services.
      </p>
      {err ? <p className="member-error">{err}</p> : null}
      {msg ? <p className="member-ok">{msg}</p> : null}

      <section className="member-card" style={{ maxWidth: 480 }}>
        <h2 className="member-title" style={{ fontSize: "1.05rem" }}>
          Block a user
        </h2>
        <p className="member-muted">Paste the other user&apos;s ID (from their profile URL or admin).</p>
        <form onSubmit={blockUser}>
          <input
            className="member-input"
            placeholder="User ID"
            value={blockedUserId}
            onChange={(e) => setBlockedUserId(e.target.value)}
            required
          />
          <button type="submit" className="member-btn primary">
            Block
          </button>
        </form>
      </section>

      <section className="member-card" style={{ maxWidth: 480 }}>
        <h2 className="member-title" style={{ fontSize: "1.05rem" }}>
          Report a user
        </h2>
        <form onSubmit={reportUser}>
          <input
            className="member-input"
            placeholder="Target user ID"
            value={reportUserId}
            onChange={(e) => setReportUserId(e.target.value)}
            required
          />
          <label className="member-muted">Reason</label>
          <select
            className="member-input"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="harassment">Harassment</option>
            <option value="fake_profile">Fake profile</option>
            <option value="underage">Underage concern</option>
            <option value="other">Other</option>
          </select>
          <textarea
            className="member-textarea"
            rows={3}
            placeholder="Optional details"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
          />
          <button type="submit" className="member-btn primary">
            Submit report
          </button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="member-title" style={{ fontSize: "1.05rem" }}>
          Emergency plans
        </h2>
        {plans.length === 0 ? (
          <p className="member-muted">No plans yet. Create via API or future form.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {plans.map((p) => (
              <li key={p.id} className="member-card" style={{ maxWidth: 480 }}>
                <strong>{p.dateLocation}</strong>
                <p className="member-muted" style={{ margin: "6px 0" }}>
                  Contact: {p.contactPhone} · Starts {new Date(p.startTime).toLocaleString()}
                  {p.endTime ? ` · Ends ${new Date(p.endTime).toLocaleString()}` : ""}
                </p>
                {p.isShared ? <span className="member-muted">Shared with contact</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/app/help">Help &amp; FAQ</Link>
      </p>
    </>
  );
}
