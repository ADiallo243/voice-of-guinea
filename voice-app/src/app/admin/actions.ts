"use server";

import { redirect } from "next/navigation";
import { createHmac } from "crypto";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseSecret } from "@/lib/supabase/admin-client";

function loginError(message: string) {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
}

async function loginQuotaKeys(email: string) {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET;
  if (!secret || !hasSupabaseSecret()) return null;
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "unknown";
  const fingerprint = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  return [fingerprint(`login:ip:${ip}`), fingerprint(`login:email:${email.toLowerCase()}`)];
}

async function consumeLoginQuota(email: string) {
  const keys = await loginQuotaKeys(email);
  if (!keys) return { allowed: true, keys: null };
  try {
    const admin = createSupabaseAdminClient();
    for (const attemptKey of keys) {
      const { data, error } = await admin.rpc("consume_login_attempt_quota", { attempt_key: attemptKey });
      if (error) throw error;
      if (!data) return { allowed: false, keys: null };
    }
    return { allowed: true, keys };
  } catch (error) {
    // Do not lock the owner out while the migration is being deployed. The
    // server log identifies a missing throttle configuration for follow-up.
    console.error("Login rate limit unavailable.", error);
    return { allowed: true, keys: null };
  }
}

async function clearLoginQuota(keys: string[] | null) {
  if (!keys) return;
  try {
    await createSupabaseAdminClient().from("login_attempt_limits").delete().in("attempt_key", keys);
  } catch (error) {
    console.error("Could not clear the login rate limit after successful sign-in.", error);
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) loginError("Entrez votre adresse e-mail et votre mot de passe.");
  const quota = await consumeLoginQuota(email);
  if (!quota.allowed) loginError("Trop de tentatives. Réessayez dans 15 minutes ou réinitialisez votre mot de passe.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) loginError("Identifiants incorrects.");
  await clearLoginQuota(quota.keys);
  redirect("/admin");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    try {
      const supabase = await createSupabaseServerClient();
      const callback = new URL("/auth/callback", siteUrl());
      callback.searchParams.set("next", "/admin/reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
      if (error) console.error("Password reset request failed.", error);
    } catch (error) {
      console.error("Password reset request failed.", error);
    }
  }
  // Always use the same response to avoid revealing which addresses have accounts.
  redirect("/admin/login?recovery=sent");
}

export async function setPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const returnPath = formData.get("flow") === "reset" ? "/admin/reset-password" : "/admin/setup-password";
  const passwordError = (message: string) => redirect(`${returnPath}?error=${encodeURIComponent(message)}`);
  if (password.length < 12) passwordError("Utilisez un mot de passe d’au moins 12 caractères.");
  if (password !== confirmation) passwordError("Les mots de passe ne correspondent pas.");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) loginError("Votre lien a expiré. Demandez un nouveau lien de réinitialisation.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) passwordError("Impossible de mettre à jour le mot de passe. Demandez un nouveau lien.");
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
