// Email sending via Resend. Becomes live the moment RESEND_API_KEY + a verified
// sending domain are set on the site. Throws EMAIL_NOT_CONFIGURED until then so
// callers can fall back gracefully.
const FROM = () => process.env.RESET_FROM || "Inner Cirql Coaching <no-reply@theinnercirql.com>";

export function emailConfigured() { return !!process.env.RESEND_API_KEY; }

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("EMAIL_NOT_CONFIGURED");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM(), to, subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error("EMAIL_SEND_FAILED:" + res.status + ":" + detail.slice(0, 200));
  }
  return true;
}

export function resetEmailHtml(name, link) {
  const who = name ? name.split(" ")[0] : "there";
  return `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:480px;margin:0 auto;padding:36px 24px;">
    <div style="text-align:center;margin-bottom:24px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#1a1a1a;">Inner Cirql <span style="color:#c9a96e;">Coaching</span></div>
    <div style="background:#fff;border:1px solid rgba(26,26,26,0.08);border-radius:16px;padding:28px 26px;">
      <p style="font-size:16px;margin:0 0 14px;">Hi ${who},</p>
      <p style="font-size:14px;color:rgba(26,26,26,0.7);line-height:1.6;margin:0 0 22px;">We got a request to set the password for your Inner Cirql members portal. Click below to choose a new password. This link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Set my password</a>
      <p style="font-size:12px;color:rgba(26,26,26,0.4);line-height:1.6;margin:22px 0 0;">If you didn't request this, you can ignore this email. Your password won't change.</p>
    </div>
    <div style="text-align:center;margin-top:18px;font-size:11px;color:rgba(26,26,26,0.4);">Private &middot; Members Only</div>
  </div></body></html>`;
}
