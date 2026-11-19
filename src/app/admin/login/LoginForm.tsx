"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/admin/ui";
import { inputClass, labelClass } from "@/components/admin/styles";
import { loginAction, type LoginState } from "@/lib/admin/actions/auth";

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Senha
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-rosa-soft p-3 text-sm font-semibold text-marinho">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
