import { getMember, verifyPassword, makeSessionCookie, json } from "../lib/auth.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return json({ error: "Email and password are required." }, 400);
  const m = await getMember(email);
  if (!m || !verifyPassword(password, m.salt, m.hash))
    return json({ error: "Invalid email or password." }, 401);
  return json({ ok: true, name: m.name, role: m.role || "member" }, 200,
    { "set-cookie": makeSessionCookie(m.email, m.name, m.role) });
};
