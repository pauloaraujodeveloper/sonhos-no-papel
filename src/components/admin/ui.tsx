"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "./styles";

/** Botão de envio com estado de carregamento e confirmação opcional (para ações destrutivas ou financeiras). */
export function SubmitButton({
  children,
  pendingLabel = "Salvando…",
  variant = "primary",
  small = false,
  confirm,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  small?: boolean;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className={buttonClass(variant, small)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
