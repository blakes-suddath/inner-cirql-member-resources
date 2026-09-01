import { getMember, makeActionToken, readSession, isAdmin, json } from "../lib/auth.mjs";
import { sendEmail, resetEmailHtml, emailConfigured } from "../lib/email.mjs";

// Admin generates a set-password link for a member. Returns the link to copy,
// and also emails it if email is configured.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAdmin(readSession(req))) return json({ error: "Unauthorized" }, 401);

  const { email } = await req.json().catch(() => ({}));
  const m = await getMember(email);
  if (!m) return json({ error: "No member with that email." }, 404);

  const token = makeActionToken("setpw", m.email, 24 * 3600 * 1000); // 24 hours
  const link = `${new URL(req.url).origin}/reset/?t=${encodeURIComponent(token)}`;

  let emailed = false;
  if (emailConfigured()) {
    try { await sendEmail({ to: m.email, subject: "Set your Inner Cirql password", html: resetEmailHtml(m.name, link) }); emailed = true; }
    catch (e) { console.error("admin reset email failed:", e.message); }
  }
  return json({ ok: true, email: m.email, name: m.name, link, emailed });
};
