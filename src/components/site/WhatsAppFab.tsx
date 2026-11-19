import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";

/** Botão flutuante de atendimento. Usa o número cadastrado no painel; some se não houver. */
export async function WhatsAppFab() {
  const settings = await db.storeSettings.findUnique({ where: { id: "default" }, select: { whatsappNumber: true } });
  if (!settings?.whatsappNumber) return null;
  return (
    <a
      href={buildWhatsAppUrl(settings.whatsappNumber, "Olá! Gostaria de tirar uma dúvida sobre a Sonhos no Papel.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a loja no WhatsApp"
      className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:scale-105 sm:bottom-6 sm:right-6"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.13.82.84-3.05-.2-.32A8.1 8.1 0 1 1 12.04 20.1Zm4.44-6.06c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
      </svg>
    </a>
  );
}
