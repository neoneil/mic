import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import type { InvoiceLineItem } from "@/lib/types";

export function normalisePartNumber(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function addMicCodes(items: InvoiceLineItem[]) {
  if (!items.some((item) => item.partNumber)) return items;

  const env = getServerEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return Promise.all(items.map(async (item) => {
    if (!item.partNumber) return item;

    const { data, error } = await supabase
      .from("part_cross_reference")
      .select("mic_code, chinese_name")
      .eq("part_number_normalized", normalisePartNumber(item.partNumber));

    if (error) {
      if (error.code !== "42P01") console.error("MIC code lookup failed", error);
      return item;
    }

    const matches = [...new Set((data ?? []).map((row) => row.mic_code).filter(Boolean))];
    const chineseNames = [...new Set((data ?? []).map((row) => row.chinese_name).filter(Boolean))];
    return {
      ...item,
      chineseName: chineseNames.length ? chineseNames.join(" / ") : null,
      micCode: matches.length ? matches.join(" / ") : null,
    };
  }));
}
