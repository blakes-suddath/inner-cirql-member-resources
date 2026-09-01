// Server-side access gate. Runs before every request. Nothing on this site is
// served without a valid ic_session cookie, except the sign-in / reset screens
// and the auth functions (which enforce their own rules). Admin paths additionally
// require an admin session.

const enc = new TextEncoder();

function b64uFromBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64uToString(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
async function hmacB64u(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64uFromBytes(new Uint8Array(sig));
}
async function verifySession(cookieHeader, secret) {
  const m = (cookieHeader || "").match(/(?:^|;\s*)ic_session=([^;]+)/);
  if (!m || !secret) return null;
  const token = decodeURIComponent(m[1]);
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expect = await hmacB64u(secret, payload);
  if (sig !== expect) return null;
  let data;
  try { data = JSON.parse(b64uToString(payload)); } catch { return null; }
  if (!data.exp || Date.now() > data.exp) return null;
  return data;
}

function isPublic(path) {
  if (path.startsWith("/.netlify/")) return true; // functions enforce their own auth
  if (path === "/login" || path.startsWith("/login/")) return true;
  if (path === "/forgot" || path.startsWith("/forgot/")) return true;
  if (path === "/reset" || path.startsWith("/reset/")) return true;
  return /^\/(favicon\.(png|svg|ico)|apple-touch-icon\.png|robots\.txt|manifest\.webmanifest|sitemap\.xml)$/.test(path);
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;
  if (isPublic(path)) return; // pass through

  const secret =
    (globalThis.Netlify && Netlify.env && Netlify.env.get("SESSION_SECRET")) ||
    (globalThis.Deno && Deno.env && Deno.env.get("SESSION_SECRET")) || "";

  const session = await verifySession(request.headers.get("cookie"), secret);
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");

  if (!session) {
    if (wantsHtml) {
      const next = encodeURIComponent(path + url.search);
      return Response.redirect(new URL("/login/?next=" + next, url), 302);
    }
    return new Response("Unauthorized", { status: 401 });
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    if (session.role !== "admin") {
      if (wantsHtml) return Response.redirect(new URL("/", url), 302);
      return new Response("Forbidden", { status: 403 });
    }
  }

  return; // authenticated -> continue to origin
};

export const config = { path: "/*" };
