import { NextResponse } from "next/server";
import { signOutOfMic } from "@/lib/auth";

export async function POST() {
  await signOutOfMic();
  return NextResponse.json({ ok: true });
}
