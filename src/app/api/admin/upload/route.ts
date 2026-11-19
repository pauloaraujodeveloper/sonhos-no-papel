import { put } from "@vercel/blob";
import { connection, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth/guard";
import { checkImage, UPLOAD_ERRORS } from "@/lib/uploads";

/**
 * Envio de imagens do painel para o Vercel Blob.
 * Protegido: exige administrador logado. Valida o tipo real e o tamanho no servidor.
 * Requer BLOB_READ_WRITE_TOKEN (criado ao conectar um Blob store ao projeto na Vercel).
 */
export async function POST(request: Request) {
  await connection();

  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Faça login para enviar imagens." }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "O armazenamento de imagens ainda não foi configurado (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Escolha uma imagem." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImage(bytes);
  if (!check.ok) {
    return NextResponse.json({ error: UPLOAD_ERRORS[check.reason] }, { status: check.reason === "TOO_LARGE" ? 413 : 415 });
  }

  try {
    // Nome gerado no servidor (o nome original do arquivo nunca é usado).
    const blob = await put(`loja/${crypto.randomUUID()}.${check.kind.ext}`, Buffer.from(bytes), {
      access: "public",
      contentType: check.kind.mime,
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch {
    console.error("[upload] falha ao enviar ao Blob");
    return NextResponse.json({ error: "Não foi possível enviar a imagem. Tente novamente." }, { status: 502 });
  }
}
