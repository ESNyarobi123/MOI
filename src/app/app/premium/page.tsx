"use client";

import { useEffect, useState } from "react";
import { userApiJson } from "@/lib/app/user-api";

type Plan = {
  id: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
};

export default function PremiumPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<unknown>(null);
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pub = await userApiJson<{ plans: Plan[] }>("/subscription/plans");
        setPlans(pub.plans);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Could not load plans");
      }
      try {
        const me = await userApiJson<{ subscription: unknown }>("/subscription/me");
        setSubscription(me.subscription);
      } catch {
        setSubscription(null);
      }
    })();
  }, []);

  async function tryCheckout() {
    setCheckoutMsg(null);
    try {
      await userApiJson("/subscription/subscribe", {
        method: "POST",
        body: JSON.stringify({})
      });
      setCheckoutMsg("Unexpected success.");
    } catch (e: unknown) {
      setCheckoutMsg(e instanceof Error ? e.message : "Checkout unavailable");
    }
  }

  return (
    <>
      <h1 className="member-title">Premium</h1>
      <p className="member-sub">
        Browse plans below. Live checkout is not enabled yet (returns 501 until Stripe).
      </p>
      {err ? <p className="member-error">{err}</p> : null}
      <section style={{ marginBottom: 24 }}>
        <h2 className="member-title" style={{ fontSize: "1.05rem" }}>
          Your subscription
        </h2>
        <pre
          className="member-card"
          style={{ fontSize: 12, overflow: "auto", maxWidth: 560 }}
        >
          {subscription ? JSON.stringify(subscription, null, 2) : "No active subscription."}
        </pre>
      </section>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {plans.map((p) => (
          <li key={p.id} className="member-card" style={{ maxWidth: 480 }}>
            <strong>{p.name}</strong>{" "}
            <span className="member-muted">
              ({(p.amount / 100).toFixed(2)} {p.currency} / {p.interval})
            </span>
            <button type="button" className="member-btn primary" style={{ marginTop: 12 }} onClick={tryCheckout}>
              Subscribe (preview)
            </button>
          </li>
        ))}
      </ul>
      {checkoutMsg ? <p className="member-muted" style={{ marginTop: 16 }}>{checkoutMsg}</p> : null}
    </>
  );
}
