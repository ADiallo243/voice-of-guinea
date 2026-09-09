import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestPasswordReset, signIn } from "../actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; recovery?: string }>;
}) {
  const configured = hasSupabaseConfig();
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/admin");
  }
  const { error, recovery } = await searchParams;

  return (
    <div className="admin-login">
      <div className="login-panel">
        <Image src="/brand/logo.svg" alt="Voice of Guinea" width={112} height={58} />
        <span className="admin-kicker">Espace sécurisé</span>
        <h1>Bienvenue dans la newsroom.</h1>
        <p>Connectez-vous pour publier et gérer les contenus de Voice of Guinea.</p>
        {!configured ? (
          <div className="admin-notice">
            <strong>Connexion Supabase à terminer</strong>
            <p>Ajoutez les deux variables du fichier <code>.env.example</code> dans <code>.env.local</code>.</p>
          </div>
        ) : (
          <>
          <form action={signIn} className="login-form">
            <label>
              Adresse e-mail
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Mot de passe
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit">Se connecter</button>
          </form>
          {recovery === "sent" && <p className="admin-flash success" role="status">Si cette adresse possède un compte, un lien de réinitialisation vient d’être envoyé.</p>}
          <details className="password-recovery">
            <summary>Mot de passe oublié ?</summary>
            <form action={requestPasswordReset} className="login-form compact">
              <label>Adresse e-mail<input name="email" type="email" required autoComplete="email" /></label>
              <button type="submit">Envoyer un lien sécurisé</button>
            </form>
          </details>
          </>
        )}
        <Link href="/">← Retour au site</Link>
      </div>
      <div className="login-visual">
        <blockquote>Informer avec clarté.<br />Publier avec confiance.</blockquote>
      </div>
    </div>
  );
}
