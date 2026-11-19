import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";
import { instagramUrl } from "@/lib/social";

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-full border border-borda bg-white text-marinho shadow-suave transition duration-200 hover:-translate-y-0.5 hover:bg-lilas-soft focus-visible:-translate-y-0.5";

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.13.82.84-3.05-.2-.32A8.1 8.1 0 1 1 12.04 20.1Zm4.44-6.06c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Ícones de WhatsApp e Instagram que levam ao atendimento da loja.
 * Os endereços vêm das Configurações do painel; cada ícone só aparece se estiver cadastrado.
 */
export async function SocialLinks({ className = "" }: { className?: string }) {
  const settings = await db.storeSettings.findUnique({
    where: { id: "default" },
    select: { whatsappNumber: true, socialLinks: true },
  });
  const whatsapp = settings?.whatsappNumber
    ? buildWhatsAppUrl(settings.whatsappNumber, "Olá! Gostaria de saber mais sobre a Sonhos no Papel.")
    : null;
  const instagram = instagramUrl((settings?.socialLinks as { instagram?: string } | null)?.instagram);
  if (!whatsapp && !instagram) return null;

  return (
    <ul className={`flex items-center gap-2 ${className}`} aria-label="Redes e contato">
      {whatsapp && (
        <li>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Conversar no WhatsApp" title="WhatsApp" className={iconButton}>
            <WhatsAppIcon />
          </a>
        </li>
      )}
      {instagram && (
        <li>
          <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Abrir o Instagram da loja" title="Instagram" className={iconButton}>
            <InstagramIcon />
          </a>
        </li>
      )}
    </ul>
  );
}
