export async function sendOtpEmail(toEmail: string, toName: string, otp: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@patra.app';
  const senderName = process.env.BREVO_SENDER_NAME || 'Patra Studio';

  if (!apiKey) {
    console.log(`[Brevo Dev Fallback] Password reset OTP for ${toEmail}: ${otp}`);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: toEmail, name: toName }],
      subject: `${otp} is your Patra verification code`,
      htmlContent: `
        <div style="font-family: Georgia, serif; background:#F7F3EC; padding:32px; color:#1A1715;">
          <div style="max-width:460px; margin:0 auto; background:#FFFDF9; border:1px solid #E5DCCF; border-radius:16px; padding:28px;">
            <h1 style="margin:0 0 8px; font-size:28px; color:#C83E37;">Patra</h1>
            <p style="font-family:sans-serif; font-size:14px; color:#5A534E; margin:0 0 20px;">
              Hi ${toName}, use this 6-digit code to reset your Patra password. It expires in 10 minutes.
            </p>
            <div style="font-family:monospace; font-size:32px; font-weight:700; letter-spacing:8px; text-align:center; background:#F7F3EC; padding:16px; border-radius:12px; color:#1A1715;">
              ${otp}
            </div>
            <p style="font-family:sans-serif; font-size:12px; color:#8A8078; margin:20px 0 0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo email failed (${res.status}): ${text}`);
  }
}
