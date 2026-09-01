import { listMembers, readSession, isAdmin, json } from "../lib/auth.mjs";

export default async (req) => {
  if (!isAdmin(readSession(req))) return json({ error: "Unauthorized" }, 401);
  const members = (await listMembers())
    .map((m) => ({
      email: m.email,
      name: m.name,
      role: m.role || "member",
      created_at: m.created_at || null,
      active: !!m.hash,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return json({ ok: true, members });
};
