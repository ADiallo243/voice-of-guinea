import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "./config";
import { createSupabaseServerClient } from "./server";

export async function getNewsroomUser(
  options: { allowMfaSetup?: boolean } = {},
) {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: identity } = await supabase.rpc("get_newsroom_identity");
  const profile = identity as {
    id: string;
    full_name: string;
    role: "owner" | "editor" | "author" | null;
    active: boolean;
  } | null;
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (
    !options.allowMfaSetup &&
    assurance?.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  )
    redirect("/admin/securite?challenge=1");
  return { user, profile, supabase };
}
