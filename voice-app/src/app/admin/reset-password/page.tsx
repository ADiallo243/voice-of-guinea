import Image from "next/image";
import { redirect } from "next/navigation";
import { setPassword } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login?error=Votre+lien+de+réinitialisation+a+expiré.");
  const { error } = await searchParams;

  return (
    <div className="admin-login">
      <div className="login-panel">
        <Image src="/brand/logo.svg" alt="Voice of Guinea" width={112} height={58} />
        <span className="admin-kicker">Accès sécurisé</span>
        <h1>Nouveau mot de passe.</h1>
        <p>Choisissez un nouveau mot de passe d’au moins 12 caractères.</p>
        <form action={setPassword} className="login-form">
          <input type="hidden" name="flow" value="reset" />
          <label>Nouveau mot de passe<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
          <label>Confirmer le mot de passe<input name="confirmation" type="password" required minLength={12} autoComplete="new-password" /></label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Mettre à jour mon mot de passe</button>
        </form>
      </div>
      <div className="login-visual"><blockquote>Informer avec clarté.<br />Publier avec confiance.</blockquote></div>
    </div>
  );
}
