import { readSession, json } from "../lib/auth.mjs";
import { readAll, findRosterByName, monthKey } from "../lib/board.mjs";

export default async (req) => {
  const s = readSession(req);
  if (!s) return json({ error: "Not signed in" }, 401);
  const agents = await readAll();
  const self = findRosterByName(s.name);
  return json({
    ok: true,
    month: monthKey(),
    agents,
    me: {
      name: s.name,
      agent: self ? self.name : null,   // the roster row this member logs as
      isCoach: !self,                    // members not on the roster (coaches) log for anyone
    },
  });
};
