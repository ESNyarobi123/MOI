"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageLoading } from "@/components/admin/AdminLoadingSkeleton";
import { IconActivity, IconHeartHandshake, IconRefresh, IconTrendingUp } from "@/components/admin/AdminIcons";
import { adminJson } from "@/lib/admin/fetch";

type Engagement = {
  totalMatches: number;
  activeMatches: number;
  inactiveMatches: number;
  totalChats: number;
  totalMessages: number;
  totalChatParticipantRows: number;
  avgMessagesPerChat: number;
};

export default function AdminEngagementPage() {
  const [data, setData] = useState<Engagement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    setRefreshing(true);
    adminJson<Engagement>("/admin/engagement")
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  if (err) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          title="Matches & chats"
          description="Privacy-safe summary — no user pairing and no message bodies."
        />
        <p className="admin-error">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          title="Matches & chats"
          description="Privacy-safe summary — no user pairing and no message bodies."
        />
        <AdminPageLoading />
      </div>
    );
  }

  const activeMatchRate = data.totalMatches > 0 ? Math.round((data.activeMatches / data.totalMatches) * 100) : 0;
  const avgParticipantsPerChat =
    data.totalChats > 0 ? (data.totalChatParticipantRows / data.totalChats).toFixed(2) : "0.00";

  const simulatedWeeklyEngagement = [44, 52, 61, 57, 73, 81, 77];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxBar = Math.max(...simulatedWeeklyEngagement);

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Matches & chats"
        description="See how matching and messaging scale. All figures are aggregate counts."
        actions={
          <button type="button" className="admin-btn ghost" onClick={load} disabled={refreshing}>
            <IconRefresh style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        }
      />

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
        <div className="admin-stat admin-stat--rose">
          <label>Total matches</label>
          <strong>{data.totalMatches}</strong>
          <div className="admin-stat-trend up">
            <IconTrendingUp style={{ width: 12, height: 12 }} />
            network growth
          </div>
        </div>
        <div className="admin-stat admin-stat--mint">
          <label>Active matches</label>
          <strong>{data.activeMatches}</strong>
          <div className="admin-stat-sub">{activeMatchRate}% of all matches are active</div>
        </div>
        <div className="admin-stat admin-stat--amber">
          <label>Total chats</label>
          <strong>{data.totalChats}</strong>
          <div className="admin-stat-sub">{avgParticipantsPerChat} participants/chat avg</div>
        </div>
        <div className="admin-stat admin-stat--purple">
          <label>Total messages</label>
          <strong>{data.totalMessages}</strong>
          <div className="admin-stat-sub">{data.avgMessagesPerChat.toFixed(2)} msgs per chat</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, marginBottom: 24 }}>
        <div className="admin-panel" style={{ marginBottom: 0 }}>
          <div className="admin-panel-head">
            <span className="admin-panel-title">Weekly engagement trend</span>
            <span className="admin-chip">Simulated visualization</span>
          </div>
          <div className="admin-bar-chart" style={{ height: 96 }}>
            {simulatedWeeklyEngagement.map((value, i) => (
              <div key={days[i]} className="admin-bar-col">
                <div
                  className={`admin-bar ${i === simulatedWeeklyEngagement.length - 1 ? "active" : ""}`}
                  style={{ height: `${(value / maxBar) * 100}%` }}
                  title={`${days[i]}: ${value}`}
                />
                <div className="admin-bar-label">{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel" style={{ marginBottom: 0 }}>
          <div className="admin-panel-head">
            <span className="admin-panel-title">Engagement health</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>Active match ratio</span>
                <strong style={{ color: "var(--admin-primary)" }}>{activeMatchRate}%</strong>
              </div>
              <div className="admin-progress">
                <div className="admin-progress-fill" style={{ width: `${Math.min(activeMatchRate, 100)}%` }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>Chat density</span>
                <strong style={{ color: "var(--admin-primary)" }}>{data.avgMessagesPerChat.toFixed(2)}</strong>
              </div>
              <div className="admin-progress">
                <div
                  className="admin-progress-fill"
                  style={{ width: `${Math.min((data.avgMessagesPerChat / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>Conversation depth</span>
                <strong style={{ color: "var(--admin-primary)" }}>{avgParticipantsPerChat}</strong>
              </div>
              <div className="admin-progress">
                <div
                  className="admin-progress-fill"
                  style={{ width: `${Math.min((Number(avgParticipantsPerChat) / 4) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel" style={{ marginBottom: 0 }}>
        <div className="admin-panel-head">
          <span className="admin-panel-title">Operational summary</span>
        </div>
        <div className="admin-feed">
          <div className="admin-feed-item">
            <div className="admin-feed-dot ok" />
            <div className="admin-feed-body">
              <strong>{data.activeMatches}</strong> active matches are currently driving live conversations.
            </div>
          </div>
          <div className="admin-feed-item">
            <div className="admin-feed-dot" />
            <div className="admin-feed-body">
              <strong>{data.totalChats}</strong> chat threads with <strong>{data.totalChatParticipantRows}</strong>{" "}
              participant rows in total.
            </div>
          </div>
          <div className="admin-feed-item">
            <div className="admin-feed-dot warn" />
            <div className="admin-feed-body">
              <strong>{data.inactiveMatches}</strong> inactive matches may need re-engagement nudges.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
