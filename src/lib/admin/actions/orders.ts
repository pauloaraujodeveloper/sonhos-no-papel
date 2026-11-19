"use server";

import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { changeOrderStatus, confirmPayment, OrderServiceError, setPaymentStatus } from "@/lib/orders/service";
import { MANUAL_PAYMENT_STATUSES, ORDER_TRANSITIONS } from "@/lib/orders/status";

/** Só aceita voltar para páginas de pedidos do painel (evita redirecionamento aberto). */
function safeReturn(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return /^\/admin\/pedidos(\/[A-Za-z0-9_-]+)?(\?[^#\s]*)?$/.test(v) ? v : fallback;
}

function withMessage(path: string, kind: "ok" | "erro", message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${kind}=${encodeURIComponent(message)}`;
}

async function perform(
  formData: FormData,
  orderId: string,
  work: (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], adminId: string) => Promise<void>,
  successMessage: string,
) {
  const admin = await requireAdmin();
  const back = safeReturn(formData.get("returnTo"), `/admin/pedidos/${orderId}`);
  let target: string;
  try {
    await db.$transaction((tx) => work(tx, admin.id), { timeout: 20000, maxWait: 5000 });
    target = withMessage(back, "ok", successMessage);
  } catch (error) {
    if (error instanceof OrderServiceError) {
      target = withMessage(back, "erro", error.message);
    } else {
      console.error("[admin/orders] falha", error instanceof Error ? error.name : "erro");
      target = withMessage(back, "erro", "Não foi possível concluir a ação. Tente novamente.");
    }
  }
  redirect(target);
}

const idSchema = z.string().min(1).max(64);

export async function confirmPaymentAction(orderId: string, formData: FormData) {
  const id = idSchema.parse(orderId);
  const note = String(formData.get("note") ?? "").slice(0, 300);
  await perform(formData, id, (tx, adminId) => confirmPayment(tx, { orderId: id, adminId, note }), "Pagamento confirmado e pedido atualizado.");
}

export async function changeStatusAction(orderId: string, formData: FormData) {
  const id = idSchema.parse(orderId);
  const to = String(formData.get("to") ?? "") as OrderStatus;
  const allowed = Object.values(ORDER_TRANSITIONS).flat();
  if (!allowed.includes(to)) redirect(withMessage(`/admin/pedidos/${id}`, "erro", "Status inválido."));
  const note = String(formData.get("note") ?? "").slice(0, 300);
  await perform(formData, id, (tx, adminId) => changeOrderStatus(tx, { orderId: id, to, adminId, note }), "Status atualizado.");
}

export async function setPaymentStatusAction(orderId: string, formData: FormData) {
  const id = idSchema.parse(orderId);
  const to = String(formData.get("to") ?? "") as PaymentStatus;
  if (!MANUAL_PAYMENT_STATUSES.includes(to)) redirect(withMessage(`/admin/pedidos/${id}`, "erro", "Status de pagamento inválido."));
  const note = String(formData.get("note") ?? "").slice(0, 300);
  await perform(formData, id, (tx, adminId) => setPaymentStatus(tx, { orderId: id, to, adminId, note }), "Pagamento atualizado.");
}

export async function addOrderNoteAction(orderId: string, formData: FormData) {
  const admin = await requireAdmin();
  const id = idSchema.parse(orderId);
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const back = `/admin/pedidos/${id}`;
  if (!note) redirect(withMessage(back, "erro", "Escreva a observação."));
  const order = await db.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) redirect(withMessage("/admin/pedidos", "erro", "Pedido não encontrado."));
  await db.orderStatusHistory.create({
    data: { orderId: id, fromStatus: order.status, toStatus: order.status, actorType: "ADMIN", adminUserId: admin.id, note },
  });
  redirect(withMessage(back, "ok", "Observação registrada."));
}
