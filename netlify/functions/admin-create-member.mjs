import { getMember, putMember, hashPassword, makeActionToken, readSession, isAdmin, json } from "../lib/auth.mjs";

// Create a member account. Authorized by an admin session, or the bootstrap ADMIN_KEY.
// Password is optional: when omitted, the member sets their own via the returned link.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authed = isAdmin(readSession(req)) || req.headers.get("x-admin-key") === process.env.ADMIN_KEY;
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const { email, name, password, role } = await req.json().catch(() => ({}));
  if (!email || !name) return json({ error: "email and name are required" }, 400);
  if (await getMember(email)) return json({ error: "That email already has an account." }, 409);

  const rec = { email, name, role: role === "admin" ? "admin" : "member", created_at: new Date().toISOString() };
  if (password) {
    if (String(password).length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
    const { salt, hash } = await hashPassword(password);
    rec.salt = salt; rec.hash = hash;
  }
  await putMember(rec);

  // set-password link (14 days) so the member sets their own password
  const token = makeActionToken("setpw", rec.email, 14 * 86400 * 1000);
  const link = `${new URL(req.url).origin}/reset/?t=${encodeURIComponent(token)}`;
  return json({ ok: true, email: rec.email, name: rec.name, role: rec.role, link }, 201);
};
