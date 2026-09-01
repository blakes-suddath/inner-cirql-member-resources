import { getStore } from "@netlify/blobs";
import { ROSTER, SEED_MONTH } from "./roster.mjs";

const store = () => getStore({ name: "leaderboard", consistency: "strong" });

export const slug = (name) =>
  String(name || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const monthKey = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

const normName = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
export function findRosterByName(name) {
  const n = normName(name);
  return ROSTER.find((a) => normName(a.name) === n) || null;
}

const clampInt = (v) => {
  const n = Math.floor(Number(v));
  if (!isFinite(n) || n < 0) return 0;
  return n > 200 ? 200 : n;
};

// Build the display board: roster identity + live numbers (stored record wins over seed).
export async function readAll() {
  const cur = monthKey();
  const st = store();
  const { blobs } = await st.list({ prefix: "agent:" });
  const stored = {};
  await Promise.all(
    (blobs || []).map(async (b) => {
      const doc = await st.get(b.key, { type: "json" });
      if (doc) stored[b.key.slice("agent:".length)] = doc;
    })
  );
  return ROSTER.map((a) => {
    const rec = stored[slug(a.name)] || { m: a.m, t: a.t, prev: a.prev, month: SEED_MONTH };
    const monthActive = (rec.month || SEED_MONTH) === cur;
    const m = monthActive ? (rec.m || { b: 0, s: 0, c: 0 }) : { b: 0, s: 0, c: 0 };
    const t = rec.t || { b: 0, s: 0, c: 0 };
    return {
      name: a.name,
      init: a.init,
      photo: a.photo || null,
      m: { b: +m.b || 0, s: +m.s || 0, c: +m.c || 0 },
      t: { b: +t.b || 0, s: +t.s || 0, c: +t.c || 0 },
      prev: rec.prev == null ? null : (+rec.prev || null),
    };
  });
}

// Rank an agent within the current board (month view = the monthly crown race).
export function rankOf(agents, name, view = "month") {
  const held = (a) => (view === "month" ? a.m.b + a.m.s : a.t.b + a.t.s);
  const clos = (a) => (view === "month" ? a.m.c : a.t.c);
  const sorted = agents.slice().sort((x, y) => held(y) - held(x) || clos(y) - clos(x) || x.name.localeCompare(y.name));
  return sorted.findIndex((a) => a.name === name) + 1;
}

// Apply a weekly submission to one agent. Only that agent's key is written (no cross-agent races).
export async function submitWeek(targetName, { buyer, seller, closings, missed }) {
  const st = store();
  const cur = monthKey();
  const a = findRosterByName(targetName);
  if (!a) throw new Error("Unknown agent");
  const key = "agent:" + slug(a.name);

  // capture rank before applying (drives the movement arrow)
  const board = await readAll();
  const prev = rankOf(board, a.name, "month");

  let doc = await st.get(key, { type: "json" });
  if (!doc) doc = { name: a.name, m: { ...a.m }, t: { ...a.t }, prev: a.prev, month: SEED_MONTH, missed_m: 0, missed_t: 0 };

  if ((doc.month || SEED_MONTH) !== cur) { doc.m = { b: 0, s: 0, c: 0 }; doc.missed_m = 0; doc.month = cur; }

  const b = clampInt(buyer), s = clampInt(seller), c = clampInt(closings), ms = clampInt(missed);
  doc.m = doc.m || { b: 0, s: 0, c: 0 };
  doc.t = doc.t || { b: 0, s: 0, c: 0 };
  doc.m.b += b; doc.m.s += s; doc.m.c += c;
  doc.t.b += b; doc.t.s += s; doc.t.c += c;
  doc.missed_m = (doc.missed_m || 0) + ms;
  doc.missed_t = (doc.missed_t || 0) + ms;
  doc.prev = prev;
  doc.name = a.name;
  doc.month = cur;
  doc.updated_at = new Date().toISOString();

  await st.setJSON(key, doc);
  return { name: a.name, added: { b, s, c, missed: ms } };
}
