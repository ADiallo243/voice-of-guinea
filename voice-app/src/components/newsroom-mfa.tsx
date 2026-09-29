"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TotpEnrollment = { id: string; qrCode: string; secret: string };

export default function NewsroomMfa() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verifiedFactorId, setVerifiedFactorId] = useState("");
  const [hasUnverifiedFactor, setHasUnverifiedFactor] = useState(false);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      if (!active) return;
      if (assuranceError || factorsError) setError("Impossible de vérifier votre session. Rechargez la page ou reconnectez-vous.");
      else if (assurance.currentLevel === "aal2") router.replace("/admin");
      else {
        setVerifiedFactorId(factors.totp.find((factor) => factor.status === "verified")?.id ?? "");
        setHasUnverifiedFactor(factors.all.some((factor) => factor.factor_type === "totp" && factor.status === "unverified"));
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [router]);

  async function beginEnrollment() {
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Voice of Guinea newsroom",
    });
    if (enrollError || !data?.totp) setError("Impossible de commencer la configuration MFA. Vérifiez la configuration Supabase Auth puis réessayez.");
    else {
      setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
      setHasUnverifiedFactor(false);
    }
    setBusy(false);
  }

  async function removeIncompleteEnrollment() {
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) setError("Impossible de charger votre facteur MFA. Rechargez la page.");
    else {
      const pending = data.all.find((factor) => factor.factor_type === "totp" && factor.status === "unverified");
      if (pending) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pending.id });
        if (removeError) setError("Impossible de réinitialiser la configuration MFA. Réessayez ou contactez le propriétaire.");
        else {
          setHasUnverifiedFactor(false);
          await beginEnrollment();
        }
      }
    }
    setBusy(false);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Entrez le code à six chiffres de votre application d’authentification.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const factorId = enrollment?.id ?? verifiedFactorId;
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError("Le code n’a pas pu être vérifié. Vérifiez l’heure de votre appareil et réessayez.");
      setBusy(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    if (verifyError) {
      setError("Code incorrect ou expiré. Entrez le nouveau code affiché dans votre application.");
      setCode("");
    } else {
      setEnrollment(null);
      router.replace("/admin");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="admin-login">
      <section className="login-panel" aria-labelledby="mfa-title">
        <Image src="/brand/logo.svg" alt="Voice of Guinea" width={112} height={58} />
        <span className="admin-kicker">Accès newsroom protégé</span>
        <h1 id="mfa-title">Vérification en deux étapes.</h1>
        <p>La rédaction utilise un code temporaire d’application pour protéger les outils et les données éditoriales.</p>
        {loading ? <p role="status">Vérification de votre session…</p> : error && !verifiedFactorId && !enrollment ? (
          <div className="admin-notice" role="alert"><p>{error}</p></div>
        ) : hasUnverifiedFactor && !enrollment ? (
          <div className="admin-notice">
            <strong>Configuration commencée mais inachevée</strong>
            <p>Si vous avez fermé l’ancienne configuration, réinitialisez le facteur temporaire et scannez un nouveau code.</p>
            <button className="mfa-button" type="button" disabled={busy} onClick={removeIncompleteEnrollment}>{busy ? "Patientez…" : "Recommencer la configuration"}</button>
          </div>
        ) : verifiedFactorId && !enrollment ? (
          <form className="login-form" onSubmit={verifyCode}>
            <label htmlFor="mfa-code">Code d’authentification à six chiffres</label>
            <input id="mfa-code" name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? "Vérification…" : "Vérifier et continuer"}</button>
          </form>
        ) : enrollment ? (
          <>
            <p>Scannez ce code avec une application d’authentification, puis saisissez le code affiché. Conservez une méthode de récupération sécurisée.</p>
            {/* Supabase supplies this SVG data URL directly from its TOTP enrollment flow. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mfa-qr" src={enrollment.qrCode} alt="Code QR pour configurer l’authentification à deux facteurs" />
            <details className="password-recovery"><summary>Impossible de scanner ?</summary><p>Ajoutez manuellement cette clé dans votre application : <code>{enrollment.secret}</code></p></details>
            <form className="login-form" onSubmit={verifyCode}>
              <label htmlFor="mfa-enroll-code">Code d’authentification à six chiffres</label>
              <input id="mfa-enroll-code" name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" disabled={busy}>{busy ? "Vérification…" : "Activer et continuer"}</button>
            </form>
          </>
        ) : (
          <div className="login-form">
            <p>Configurez une application d’authentification pour votre compte newsroom.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="button" disabled={busy} onClick={beginEnrollment}>{busy ? "Préparation…" : "Configurer l’authentification"}</button>
          </div>
        )}
        <Link href="/admin/login">← Retour à la connexion</Link>
      </section>
      <div className="login-visual"><blockquote>Protéger la rédaction.<br />Protéger nos lecteurs.</blockquote></div>
    </div>
  );
}
