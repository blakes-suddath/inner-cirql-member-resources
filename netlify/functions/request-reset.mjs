import { getMember, makeActionToken, json } from "../lib/auth.mjs";
import { sendEmail, resetEmailHtml, emailConfigured } from "../lib/email.mjs";

// Self-service "forgot password". Always returns ok (no account enumeration).
// Sends a reset link by email when email is configured.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const { email } = await req.json().catch(() => ({}));
  const ok = { ok: true };
  if (!email) return json(ok);

  const m = await getMember(email);
  if (m) {
    const token = makeActionToken("setpw", m.email, 60 * 60 * 1000); // 1 hour
    const origin = new URL(req.url).origin;
    const link = `${origin}/reset/?t=${encodeURIComponent(token)}`;
    if (emailConfigured()) {
      try {
        await sendEmail({ to: m.email, subject: "Reset your Inner Cirql password", html: resetEmailHtml(m.name, link) });
      } catch (e) {
        console.error("reset email failed:", e.message);
      }
    } else {
      console.warn("request-reset: email not configured; reset link not delivered for", m.email);
    }
  }
  return json(ok);
};
