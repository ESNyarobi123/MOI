export function getHelpContent() {
  return {
    supportEmail: process.env.SUPPORT_EMAIL ?? "support@moidate.app",
    faqs: [
      {
        q: "How do I verify my email?",
        a: "After registering, enter the 6-digit code sent to your inbox (or check server logs in development)."
      },
      {
        q: "How does matching work?",
        a: "Like or superlike someone who also likes you to create a match. Then you can open a chat."
      },
      {
        q: "How do I stay safe?",
        a: "Use block and report, share your date plan with a trusted contact, and meet in public first."
      },
      {
        q: "Premium billing?",
        a: "In-app purchases and Stripe checkout are coming soon. Plans shown are informational."
      }
    ]
  };
}
