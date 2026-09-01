import { readSession, json } from "../lib/auth.mjs";
import { readAll, findRosterByName, submitWeek } from "../lib/board.mjs";

// Agents log their own week (name is taken from their session, not trusted from the client).
// Coaches (members not on the roster, e.g. Blake/Tyler) may log on behalf of any agent.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const s = readSession(req);
  if (!s) return json({ error: "Not signed in" }, 401);

  const body = await req.json().catch(() => ({}));
  const self = findRosterByName(s.name);

  let target;
  if (self) {
    target = self.name; // locked to the signed-in agent
  } else {
    const t = findRosterByName(body.for);
    if (!t) return json({ error: "Pick an agent to log for." }, 400);
    target = t.name;
  }

  try {
    const res = await submitWeek(target, body);
    const agents = await readAll();
    return json({ ok: true, ...res, agents });
  } catch (e) {
    return json({ error: e.message || "Could not log the week." }, 400);
  }
};
