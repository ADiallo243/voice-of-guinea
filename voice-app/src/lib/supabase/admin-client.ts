import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function hasSupabaseSecret() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

export function createSupabaseAdminClient() {
  const { url } = getSupabaseConfig();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not configured.");

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
