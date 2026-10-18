import { NextResponse } from "next/server";
import { z } from "zod";
import { signInToMic } from "@/lib/auth";

const schema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const result = await signInToMic(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return NextResponse.json({ error: "Login failed or this account does not have MIC access." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, email: result.user.email });
}
