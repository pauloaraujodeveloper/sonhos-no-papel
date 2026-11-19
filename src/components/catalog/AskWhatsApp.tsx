import { RiArrowRightLine } from "@remixicon/react";
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
      className="group inline-flex min-h-11 items-center gap-1 text-sm font-bold text-accent-600 transition-colors duration-300 ease-out hover:text-marinho"
    >
      Tirar uma dúvida pelo WhatsApp
      <RiArrowRightLine aria-hidden="true" className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
    </a>
  );
}
