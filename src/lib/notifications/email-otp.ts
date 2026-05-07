/**
 * Registration OTP delivery. Uses Resend when RESEND_API_KEY is set; optional SMTP via native API is deferred.
 */
export async function sendRegistrationOtp(email: string, code: string) {
  const subject = "Verify your MoiDate email";
  const text = `Your verification code is ${code}. It expires in 15 minutes.`;

  if (process.env.RESEND_API_KEY) {
    const from = process.env.RESEND_FROM ?? "MoiDate <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email-otp] Resend failed", res.status, err);
    }
    return;
  }

  const line = `[MoiDate] ${subject} for ${email}: ${code} (expires in 15 minutes)`;
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.SMTP_HOST &&
    !process.env.RESEND_API_KEY
  ) {
    console.warn(
      "[email-otp] Production: set RESEND_API_KEY (or wire SMTP) to deliver OTP. Message:",
      line
    );
    return;
  }
  console.info(line);
}
