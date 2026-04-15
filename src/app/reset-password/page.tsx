import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#050508] text-slate-400">
          Carregando…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
