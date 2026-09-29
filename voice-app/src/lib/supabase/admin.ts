import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "./config";
import { createSupabaseServerClient } from "./server";

export async function getNewsroomUser() {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance.currentLevel !== "aal2") redirect("/admin/mfa");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .single();

  return { user, profile, supabase };
}
