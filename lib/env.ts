import "server-only";
import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  MIC_LOGIN_EMAIL: z.email(),
  MIC_LOGIN_PASSWORD: z.string().min(6),
});

export function getServerEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    throw new Error("Server storage is not configured. Fill in .env.local and restart the app.");
  }
  return result.data;
}
