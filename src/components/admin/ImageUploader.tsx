"use client";

import { useRef, useState } from "react";
import { buttonClass } from "./styles";

/**
 * Botão "Enviar foto": envia o arquivo para /api/admin/upload e coloca o link retornado no campo
 * indicado (textarea de imagens, uma por linha, ou input de uma imagem só).
 */
export function ImageUploader({ targetId, multiple = false }: { targetId: string; multiple?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        setMessage({ kind: "erro", text: json.error ?? "Não foi possível enviar a imagem." });
        return;
      }
      const field = document.getElementById(targetId) as HTMLInputElement | HTMLTextAreaElement | null;
      if (field) {
        field.value = multiple && field.value.trim() ? `${field.value.trim()}\n${json.url}` : json.url;
      }
      setMessage({ kind: "ok", text: "Imagem enviada. Salve para publicar." });
    } catch {
      setMessage({ kind: "erro", text: "Sem conexão. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onChange} aria-label="Escolher imagem" />
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={buttonClass("secondary", true)}>
        {busy ? "Enviando…" : "Enviar foto"}
      </button>
      <span className="text-xs text-muted">JPG, PNG ou WebP, até 4 MB.</span>
      {message && (
        <span role={message.kind === "erro" ? "alert" : "status"} className={`text-xs font-semibold ${message.kind === "erro" ? "text-marinho" : "text-accent-600"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
