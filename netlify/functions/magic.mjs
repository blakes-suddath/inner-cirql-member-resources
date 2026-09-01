import { getMember, verifyMagic, makeSessionCookie } from "../lib/auth.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const email = verifyMagic(url.searchParams.get("t"));
  if (!email) return new Response("This link isn't valid.", { status: 401 });

  const m = await getMember(email);
  if (!m) return new Response("No member found for this link.", { status: 404 });

  // long-lived session so this person effectively stays signed in
  const cookie = makeSessionCookie(m.email, m.name, m.role, 365);

  let next = url.searchParams.get("next") || "/";
  if (next.charAt(0) !== "/" || next.charAt(1) === "/") next = "/";

  return new Response(null, {
    status: 302,
    headers: { location: next, "set-cookie": cookie },
  });
};
