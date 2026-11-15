"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
export function MfaSetup() {
  const router = useRouter();
  const [factor, setFactor] = useState(""),
    [qr, setQr] = useState(""),
    [code, setCode] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function prepare() {
    setBusy(true);
    setMessage("");
    try {
      const client = createSupabaseBrowserClient();
      const { data: list, error: listError } =
        await client.auth.mfa.listFactors();
      if (listError) throw listError;
      const existing = list.totp.find((f) => f.status === "verified");
      if (existing) {
        setFactor(existing.id);
        setMessage(
          "Saisissez le code de votre application d’authentification.",
        );
        return;
      }
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Voice of Guinea ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      setFactor(data.id);
      setQr(data.totp.qr_code);
      setMessage(
        "Scannez le QR code dans votre application, puis saisissez le code à six chiffres. Conservez votre accès à l’application pour les prochaines connexions.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Configuration indisponible.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    try {
      const client = createSupabaseBrowserClient();
      const { error } = await client.auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Code invalide.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-panel">
      <button
        className="admin-primary"
        type="button"
        disabled={busy}
        onClick={prepare}
      >
        Configurer ou confirmer la double authentification
      </button>
      {message && <p role="status">{message}</p>}
      {qr && (
        <Image
          unoptimized
          width={240}
          height={240}
          alt="QR code privé à scanner dans votre application d’authentification"
          src={qr}
        />
      )}{" "}
      {factor && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <label>
            Code de l’application
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </label>
          <button className="admin-primary" disabled={busy} type="submit">
            Vérifier le code
          </button>
        </form>
      )}
      <p>
        <Link href="/admin">Retour à la rédaction</Link>
      </p>
      <p>
        Si votre appareil est perdu, utilisez une procédure de récupération
        vérifiée auprès du propriétaire du projet Supabase. Ne partagez jamais
        votre QR code.
      </p>
    </section>
  );
}
