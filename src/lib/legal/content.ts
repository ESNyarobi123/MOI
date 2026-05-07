export type LegalDocKey = "terms" | "privacy" | "cookies";

type LegalDoc = {
  key: LegalDocKey;
  title: string;
  version: string;
  lastUpdated: string;
  summary: string;
  content: string;
};

const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  terms: {
    key: "terms",
    title: "Terms of Service",
    version: "1.0.0",
    lastUpdated: "2026-05-07",
    summary: "Rules and responsibilities for using MoiDate.",
    content: `Welcome to MoiDate. By using our platform, you agree to these Terms of Service.

1. Eligibility
- You must be at least 18 years old to create and use a MoiDate account.
- You must provide accurate account details and keep your credentials secure.

2. Acceptable Use
- Do not harass, scam, impersonate, or share harmful content.
- Do not post illegal, explicit, or abusive material.
- Do not attempt to bypass safety, moderation, or security controls.

3. Payments and Premium
- Premium features may require subscription payments.
- Billing terms, renewal cycles, and cancellations are shown before payment.
- Refund handling follows applicable payment provider rules and local laws.

4. Account Moderation
- We may suspend or terminate accounts that violate platform rules.
- Severe abuse may be reported to relevant authorities where required.

5. Liability
- MoiDate provides the platform "as is" and cannot guarantee user outcomes.
- We are not responsible for off-platform interactions between users.

6. Updates
- We may update these terms from time to time.
- Continued use after updates means acceptance of revised terms.
`
  },
  privacy: {
    key: "privacy",
    title: "Privacy Policy",
    version: "1.0.0",
    lastUpdated: "2026-05-07",
    summary: "How MoiDate collects, uses, and protects personal data.",
    content: `MoiDate respects your privacy. This policy explains how we handle personal information.

1. Data We Collect
- Account details: name, email, date of birth, profile information.
- Usage data: app activity, interactions, diagnostics, device metadata.
- Optional data: uploaded photos, preferences, support messages.

2. How We Use Data
- To provide matching, messaging, safety, and support features.
- To improve service reliability, fraud prevention, and moderation.
- To send important account and security notifications.

3. Data Sharing
- We do not sell personal data.
- Data may be shared with trusted processors (hosting, analytics, payment) under contracts.
- We may disclose data when required by law or to protect users and platform integrity.

4. Data Security
- We use technical and organizational safeguards to protect user data.
- No system is 100% secure; users should maintain strong passwords and device security.

5. Your Rights
- You can request access, correction, or deletion of personal data where applicable.
- You can update profile visibility and notification settings in the app.

6. Retention
- Data is retained as needed for service operations, legal obligations, and security.
- Deleted accounts may be removed or anonymized according to policy and law.
`
  },
  cookies: {
    key: "cookies",
    title: "Cookies Policy",
    version: "1.0.0",
    lastUpdated: "2026-05-07",
    summary: "How cookies and similar technologies are used.",
    content: `This Cookies Policy explains how MoiDate uses cookies and similar technologies.

1. What Cookies Are
- Cookies are small data files stored on your device to improve user experience.

2. Why We Use Cookies
- Essential cookies for authentication and session continuity.
- Preference cookies to remember settings and language choices.
- Analytics cookies to understand usage patterns and improve features.
- Security cookies to detect suspicious activity and prevent abuse.

3. Third-Party Technologies
- Some integrations may set their own cookies under their privacy terms.

4. Your Choices
- You can manage browser/app storage and cookie settings on your device.
- Disabling certain cookies may affect platform functionality.

5. Policy Changes
- We may update this policy and will publish the latest version with update date.
`
  }
};

export function getLegalDoc(key: LegalDocKey) {
  return LEGAL_DOCS[key];
}

export function getAllLegalDocs() {
  return Object.values(LEGAL_DOCS).map(({ content, ...doc }) => doc);
}

