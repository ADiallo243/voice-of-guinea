import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { MfaSetup } from "@/components/mfa-setup";
export const dynamic = "force-dynamic";
export default async function Security() {
  const room = await getNewsroomUser({ allowMfaSetup: true });
  if (!room?.profile?.active || !room.profile.role) redirect("/admin/login");
  return (
    <main className="shell page-section">
      <h1>Sécuriser votre accès à la rédaction</h1>
      <p>
        Configurez votre propre application d’authentification ou confirmez
        votre connexion. Le code et la clé restent dans votre navigateur.
      </p>
      <MfaSetup />
    </main>
  );
}
