/**
 * Push notifications (FCM). Stub: wire FIREBASE_PROJECT_ID + service account when mobile clients are ready.
 */
export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: boolean; reason: string }> {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.info(
      "[push] stub: would notify user",
      userId,
      payload.title,
      "(configure Firebase env to send FCM)"
    );
    return { sent: false, reason: "not_configured" };
  }

  console.warn(
    "[push] Firebase credentials present but HTTP v1 send is not wired in this build.",
    userId
  );
  return { sent: false, reason: "stub" };
}
