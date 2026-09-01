import { readSession, json } from "../lib/auth.mjs";
export default async (req) => {
  const s = readSession(req);
  if (!s) return json({ authenticated: false }, 401);
  return json({ authenticated: true, email: s.email, name: s.name, role: s.role || "member" });
};
