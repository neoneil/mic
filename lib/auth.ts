import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "mic_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function equal(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string) {
  return createHmac("sha256", getServerEnv().SUPABASE_SERVICE_ROLE_KEY).update(payload).digest("base64url");
}

function createSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, expiresAt: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function readSession(value?: string) {
  if (!value) return null;
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature || !equal(signature(payload), suppliedSignature)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; expiresAt?: number };
    if (!parsed.email || !parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getMicUser() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(COOKIE_NAME)?.value);
  return session ? { email: session.email } : null;
}

export async function signInToMic(email: string, password: string) {
  const env = getServerEnv();
  if (!equal(email.toLowerCase(), env.MIC_LOGIN_EMAIL.toLowerCase()) || !equal(password, env.MIC_LOGIN_PASSWORD)) {
    return { ok: false as const };
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSession(env.MIC_LOGIN_EMAIL), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return { ok: true as const, user: { email: env.MIC_LOGIN_EMAIL } };
}

export async function signOutOfMic() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
