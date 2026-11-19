import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";

/** Link "Tirar dúvida pelo WhatsApp" já com o nome do produto. Some se o WhatsApp não estiver configurado. */
export async function AskWhatsApp({ productName }: { productName: string }) {
  const settings = await db.storeSettings.findUnique({ where: { id: "default" }, select: { whatsappNumber: true } });
  if (!settings?.whatsappNumber) return null;
  return (
    <a
      href={buildWhatsAppUrl(settings.whatsappNumber, `Olá! Tenho uma dúvida sobre o produto "${productName}".`)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block text-sm font-bold text-accent-600 hover:underline"
    >
      Tirar uma dúvida pelo WhatsApp →
    </a>
  );
}
