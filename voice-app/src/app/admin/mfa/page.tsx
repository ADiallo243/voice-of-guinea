import { redirect } from "next/navigation";
import NewsroomMfa from "@/components/newsroom-mfa";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Vérification sécurisée | Voice of Guinea", robots: { index: false, follow: false } };

export default async function AdminMfaPage() {
  if (!hasSupabaseConfig()) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2") redirect("/admin");
  return <NewsroomMfa />;
}
