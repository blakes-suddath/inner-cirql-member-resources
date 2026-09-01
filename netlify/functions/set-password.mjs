import { getMember, putMember, hashPassword, verifyActionToken, makeSessionCookie, json } from "../lib/auth.mjs";

// Redeems an invite / reset token and sets a new password, then signs the member in.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const { token, password } = await req.json().catch(() => ({}));
  const email = verifyActionToken("setpw", token);
  if (!email) return json({ error: "This link is invalid or has expired. Request a new one." }, 401);
  if (!password || String(password).length < 8)
    return json({ error: "Password must be at least 8 characters." }, 400);

  const m = await getMember(email);
  if (!m) return json({ error: "No account found for this link." }, 404);

  const { salt, hash } = await hashPassword(password);
  m.salt = salt; m.hash = hash; m.updated_at = new Date().toISOString();
  await putMember(m);

  return json({ ok: true, name: m.name, role: m.role || "member" }, 200,
    { "set-cookie": makeSessionCookie(m.email, m.name, m.role) });
};
