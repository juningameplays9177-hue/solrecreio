import {
  apiErrorString,
  scrubStaleGoogleConfigMessage,
} from "@/lib/scrub-stale-google-config-message";

export type GoogleAuthExchangeResult =
  | { ok: true; role: string; profileComplete: boolean; needsRegistration?: false }
  | { ok: true; needsRegistration: true; email: string; name?: string }
  | { ok: false; error: string };

export async function exchangeGoogleIdToken(idToken: string): Promise<GoogleAuthExchangeResult> {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: scrubStaleGoogleConfigMessage(apiErrorString(data)) };
  }
  if (data?.needsRegistration === true) {
    const email = typeof data.email === "string" ? data.email : "";
    const name = typeof data.name === "string" ? data.name : undefined;
    return { ok: true, needsRegistration: true, email, name };
  }
  const role = typeof data.role === "string" ? data.role : "CLIENT";
  const profileComplete = data.profileComplete !== false;
  return { ok: true, role, profileComplete };
}
