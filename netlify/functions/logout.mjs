import { clearCookie, json } from "../lib/auth.mjs";
export default async () => json({ ok: true }, 200, { "set-cookie": clearCookie() });
