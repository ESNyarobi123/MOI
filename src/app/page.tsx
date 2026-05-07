"use client";

import "./landing.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [annCount, setAnnCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/announcements")
      .then((r) => r.json())
      .then((j) => setAnnCount(j?.data?.items?.length ?? 0))
      .catch(() => null);
  }, []);

  function blocked(e: React.MouseEvent) {
    e.preventDefault();
    alert("Register & Login screens are coming soon. Stay tuned!");
  }

  return (
    <>
      {/* ── Nav ── */}
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <Image src="/moidate.png" alt="MoiDate" width={38} height={38} className="logo-mark-img" priority />
            MoiDate
          </Link>
          <nav className="nav-links">
            <a href="#discover">Discover</a>
            <a href="#safety">Safety</a>
            <a href="#premium">Premium</a>
            <Link href="/admin/login">Dashboard</Link>
          </nav>
          <div className="nav-actions">
            <button type="button" className="btn btn-ghost" onClick={blocked}>Sign In</button>
            <button type="button" className="btn btn-primary" onClick={blocked}>Join 18+</button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero" id="discover">
          <div className="container hero-grid">
            <div>
              <span className="badge">
                <span className="material-symbols-outlined">verified_user</span>
                Connect. Match. Feel.
              </span>
              <h1>Meet softly.<br />Match deeply.</h1>
              <p className="lead">
                MoiDate is a safe romantic connection platform for adults. Create your profile,
                discover real people, match, chat, send gifts and unlock verified premium
                experiences.
              </p>
              <div className="cta-row">
                <button type="button" className="btn btn-primary" onClick={blocked}>
                  Begin Your Journey
                </button>
                <a className="btn btn-soft" href="#safety">
                  View Safety Standards
                </a>
              </div>
            </div>
            <div className="hero-card">
              <div className="float-card">
                <div className="kpi">
                  <span className="material-symbols-outlined">favorite</span>
                  98% Compatibility
                </div>
                <p>
                  Matches are based on values, preferences, lifestyle rhythm, and safety readiness.
                </p>
                {annCount !== null && (
                  <span className="live-badge">
                    {annCount > 0 ? `${annCount} updates live` : "Platform live"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Safety + Feature cards ── */}
        <section className="section" id="safety">
          <div className="container grid-2">
            <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="icon">
                <span className="material-symbols-outlined">shield_with_heart</span>
              </div>
              <h2>Your peace of mind is part of the architecture.</h2>
              <p>
                Multi-step verification, report tools, moderation queues, and privacy-first
                messaging make the product feel complete from landing page to admin panel.
              </p>
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="icon"><span className="material-symbols-outlined">badge</span></div>
                <h3>Identity Review</h3>
                <p>Profile status, verification badges, and account trust levels.</p>
              </div>
              <div className="card">
                <div className="icon"><span className="material-symbols-outlined">forum</span></div>
                <h3>Safe Chat</h3>
                <p>Conversation UI with moderation-ready flags and user controls.</p>
              </div>
              <div className="card" id="premium">
                <div className="icon"><span className="material-symbols-outlined">workspace_premium</span></div>
                <h3>Premium Plans</h3>
                <p>Free, Standard, Premium, and Elite membership flow.</p>
              </div>
              <div className="card">
                <div className="icon"><span className="material-symbols-outlined">admin_panel_settings</span></div>
                <h3>Admin Control</h3>
                <p>Moderation dashboard for reports, profiles, and approvals.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Product loop ── */}
        <section className="section section-2">
          <div className="container">
            <div className="section-head">
              <h2>The MoiDate product loop</h2>
              <p>
                Register, verify, discover, match, message, upgrade, and moderate. One platform
                shows the whole product journey.
              </p>
            </div>
            <div className="grid-3">
              <div className="card">
                <div className="icon"><span className="material-symbols-outlined">person_add</span></div>
                <h3>1. Join</h3>
                <p>User creates an account, accepts 18+ safety rules, and starts onboarding.</p>
              </div>
              <div className="card">
                <div className="icon"><span className="material-symbols-outlined">travel_explore</span></div>
                <h3>2. Discover</h3>
                <p>Dashboard presents curated matches, compatibility signals, and safe actions.</p>
              </div>
              <div className="card">
                <div className="icon"><span className="material-symbols-outlined">manage_accounts</span></div>
                <h3>3. Moderate</h3>
                <p>Admin reviews profiles, reported users, verification status, and platform health.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-inner">
          <strong className="brand">
            <span className="logo-mark">M</span> MoiDate Premium
          </strong>
          <div>Privacy • Terms • Safety Tips • Contact Support</div>
          <div>© 2026 MoiDate. Adult community, 18+ only.</div>
        </div>
      </footer>
    </>
  );
}
