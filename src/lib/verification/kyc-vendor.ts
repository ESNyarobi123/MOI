/**
 * Stub for external KYC (OCR, liveness, Onfido/Veriff/etc.).
 * Replace with HTTP client to your vendor; keep PII out of logs in production.
 */
export async function notifyVendorVerificationSubmitted(input: {
  userId: string;
  recordId: string;
  idDocUrl?: string | null;
  selfieUrl?: string | null;
}) {
  if (process.env.KYC_VENDOR_WEBHOOK_URL) {
    console.info(
      "[kyc-vendor] Would POST to KYC_VENDOR_WEBHOOK_URL for record",
      input.recordId,
      "user",
      input.userId
    );
    return { queued: true as const };
  }
  console.info(
    "[kyc-vendor] No KYC_VENDOR_WEBHOOK_URL — manual admin review only.",
    input.recordId
  );
  return { queued: false as const };
}
