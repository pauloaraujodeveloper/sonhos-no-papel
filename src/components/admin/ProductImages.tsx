"use client";

import { useRef, useState } from "react";
import { buttonClass } from "./styles";

const MAX_IMAGES = 8;
const MIN_SLOTS = 3;

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const json = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !json.url) throw new Error(json.error ?? "Não foi possível enviar a imagem.");
  return json.url;
}

/**
 * Fotos do produto em espaços (mínimo 3 visíveis, até 8). A primeira é a principal.
 * Dá para escolher várias fotos de uma vez, trocar, remover e escolher qual é a principal.
 * O formulário recebe os links no campo "images", um por linha (a validação continua no servidor).
 */
export function ProductImages({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial.slice(0, MAX_IMAGES));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef<number | null>(null);

  const slots = Math.max(MIN_SLOTS, Math.min(MAX_IMAGES, urls.length + 1));

  function pick(index: number | null) {
    replaceIndex.current = index;
    inputRef.current?.click();
  }

  async function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setBusy(true);
    setMessage(null);
    let next = [...urls];
    let sent = 0;
    const errors: string[] = [];

    for (const [i, file] of files.entries()) {
      const replacing = replaceIndex.current !== null && i === 0;
      if (!replacing && next.length >= MAX_IMAGES) {
        errors.push(`O limite é de ${MAX_IMAGES} fotos.`);
        break;
      }
      try {
        const url = await uploadImage(file);
        if (replacing) next[replaceIndex.current as number] = url;
        else next = [...next, url];
        sent += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Falha no envio.");
      }
    }

    setUrls(next);
    replaceIndex.current = null;
    setBusy(false);
    if (errors.length > 0) setMessage({ kind: "erro", text: errors[0] });
    else setMessage({ kind: "ok", text: `${sent} ${sent === 1 ? "foto enviada" : "fotos enviadas"}. Salve o produto para publicar.` });
  }

  function remove(index: number) {
    setUrls((current) => current.filter((_, i) => i !== index));
    setMessage(null);
  }

  function makeMain(index: number) {
    setUrls((current) => [current[index], ...current.filter((_, i) => i !== index)]);
    setMessage(null);
  }

  return (
    <div>
      {/* Campo lido pelo servidor: um link por linha. */}
      <textarea name="images" value={urls.join("\n")} readOnly hidden aria-hidden="true" />

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={onFiles} aria-label="Escolher fotos do produto" />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Fotos do produto">
        {Array.from({ length: slots }).map((_, index) => {
          const url = urls[index];
          return (
            <li key={index} className="space-y-2">
              {url ? (
                <div className="relative aspect-square overflow-hidden rounded-md border border-borda bg-white">
                  {/* Imagem vinda do Vercel Blob ou de link https cadastrado. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${index + 1} do produto`} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-marinho px-2.5 py-0.5 text-xs font-bold text-papel">Principal</span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy || urls.length >= MAX_IMAGES}
                  onClick={() => pick(null)}
                  aria-label={`Adicionar foto ${index + 1}`}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-borda bg-white text-sm font-bold text-marinho-texto transition-colors duration-300 ease-out hover:bg-lilas-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true" className="text-2xl leading-none">+</span>
                  {index === 0 ? "Foto principal" : `Foto ${index + 1}`}
                </button>
              )}
              {url && (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={busy} onClick={() => pick(index)} className={buttonClass("secondary", true)} aria-label={`Trocar a foto ${index + 1}`}>
                    Trocar
                  </button>
                  {index > 0 && (
                    <button type="button" disabled={busy} onClick={() => makeMain(index)} className={buttonClass("secondary", true)} aria-label={`Tornar a foto ${index + 1} a principal`}>
                      Principal
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => remove(index)} className={buttonClass("danger", true)} aria-label={`Remover a foto ${index + 1}`}>
                    Remover
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || urls.length >= MAX_IMAGES} onClick={() => pick(null)} className={buttonClass("secondary", true)}>
          {busy ? "Enviando…" : "Escolher várias fotos"}
        </button>
        <span className="text-xs text-muted">
          {urls.length} de {MAX_IMAGES} fotos · JPG, PNG ou WebP, até 4 MB cada. A primeira é a principal.
        </span>
        {message && (
          <span role={message.kind === "erro" ? "alert" : "status"} className={`text-xs font-semibold ${message.kind === "erro" ? "text-marinho" : "text-accent-600"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
