import { getMember, putMember, makeActionToken, json } from "../lib/auth.mjs";

// One-time bootstrap: promote Blake + Tyler to admin and return set-password links.
// Guarded by ADMIN_KEY. Existing passwords are left intact; the links let them set new ones.
const ADMINS = [
  { email: "blake@soldwithsuddath.com", name: "Blake Suddath" },
  { email: "tyler@soldwithsuddath.com", name: "Tyler" },
];

export default async (req) => {
  if (req.headers.get("x-admin-key") !== process.env.ADMIN_KEY) return json({ error: "Unauthorized" }, 401);
  const origin = new URL(req.url).origin;
  const out = {};
  for (const a of ADMINS) {
    const existing = await getMember(a.email);
    const rec = existing || { email: a.email, name: a.name, created_at: new Date().toISOString() };
    rec.role = "admin";
    if (!rec.name) rec.name = a.name;
    await putMember(rec);
    const token = makeActionToken("setpw", a.email, 14 * 86400 * 1000);
    out[a.email] = `${origin}/reset/?t=${encodeURIComponent(token)}`;
  }
  return json({ ok: true, links: out });
};
