import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const ITER = 210000, KEYLEN = 64, DIGEST = "sha512";
const store = () => getStore({ name: "members", consistency: "strong" });
const norm = (e) => String(e || "").trim().toLowerCase();

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(pw, salt, ITER, KEYLEN, DIGEST).toString("hex");
  return { salt, hash };
}
export function verifyPassword(pw, salt, hash) {
  if (!salt || !hash) return false;
  const h = crypto.pbkdf2Sync(pw, salt, ITER, KEYLEN, DIGEST).toString("hex");
  const a = Buffer.from(h, "hex"), b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export async function getMember(email) {
  const e = norm(email); if (!e) return null;
  return await store().get(`m:${e}`, { type: "json" });
}
export async function putMember(m) {
  m.email = norm(m.email);
  await store().setJSON(`m:${m.email}`, m);
  return m;
}
export async function listMembers() {
  const st = store();
  const { blobs } = await st.list({ prefix: "m:" });
  const out = await Promise.all((blobs || []).map((b) => st.get(b.key, { type: "json" })));
  return out.filter(Boolean);
}

function secret() { return process.env.SESSION_SECRET || "dev-insecure-change-me"; }
const b64u = (b) => Buffer.from(b).toString("base64url");
const hmac = (msg) => b64u(crypto.createHmac("sha256", secret()).update(msg).digest());
function eq(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// --- session cookie (signed, carries email + name + role) ---
export function makeSessionCookie(email, name, role = "member", days = 30) {
  const exp = Date.now() + days * 86400000;
  const payload = b64u(JSON.stringify({ email: norm(email), name, role: role || "member", exp }));
  const sig = hmac(payload);
  return `ic_session=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${days * 86400}`;
}
export function clearCookie() { return `ic_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }

export function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!eq(sig, hmac(payload))) return null;
  let data; try { data = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
  if (!data.exp || Date.now() > data.exp) return null;
  if (!data.role) data.role = "member";
  return data;
}
export function readSession(req) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)ic_session=([^;]+)/);
  return m ? verifyToken(decodeURIComponent(m[1])) : null;
}
export function isAdmin(session) { return !!session && session.role === "admin"; }

// --- personal magic link (permanent, per-email bearer token) ---
export function makeMagicToken(email) {
  const msg = "magic:" + norm(email);
  return b64u(msg) + "." + hmac(msg);
}
export function verifyMagic(token) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  let raw; try { raw = Buffer.from(payload, "base64url").toString(); } catch { return null; }
  if (!raw.startsWith("magic:")) return null;
  if (!eq(sig, hmac(raw))) return null;
  return raw.slice(6);
}

// --- action tokens (set-password / reset), purpose-scoped + expiring ---
export function makeActionToken(purpose, email, ttlMs) {
  const body = JSON.stringify({ p: purpose, e: norm(email), x: Date.now() + ttlMs });
  const payload = b64u(body);
  return payload + "." + hmac(payload);
}
export function verifyActionToken(purpose, token) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!eq(sig, hmac(payload))) return null;
  let d; try { d = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
  if (d.p !== purpose || !d.x || Date.now() > d.x || !d.e) return null;
  return d.e;
}

export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...extra } });
