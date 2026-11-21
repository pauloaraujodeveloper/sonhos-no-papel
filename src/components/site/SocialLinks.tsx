import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";
import { instagramUrl } from "@/lib/social";

// Cores oficiais de cada rede (identificação da marca de terceiros, não fazem parte da paleta editável).
const base =
  "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-suave ring-1 ring-black/5 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5";
const whatsappStyle = "bg-[#25d366] hover:bg-[#1ebe5b]";
const instagramStyle = "bg-[linear-gradient(45deg,#feda75_0%,#fa7e1e_25%,#d62976_50%,#962fbf_75%,#4f5bd5_100%)] hover:brightness-110";

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.13.82.84-3.05-.2-.32A8.1 8.1 0 1 1 12.04 20.1Zm4.44-6.06c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function InstagramIcon() {
  // Preenchido, como o ícone de WhatsApp: contorno, lente e ponto vazados (regra evenodd).
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" fillRule="evenodd">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Z M7.5 3.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Z M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z M17.2 4.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
    </svg>
  );
}

/** Parte visual dos ícones (sem acesso ao banco): recebe os links já prontos. */
export function SocialLinksView({ whatsapp, instagram, className = "" }: { whatsapp?: string | null; instagram?: string | null; className?: string }) {
  if (!whatsapp && !instagram) return null;
  return (
    <ul className={`flex items-center gap-2.5 ${className}`} aria-label="Redes e contato">
      {whatsapp && (
        <li>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Conversar no WhatsApp" title="WhatsApp" className={`${base} ${whatsappStyle}`}>
            <WhatsAppIcon />
          </a>
        </li>
      )}
      {instagram && (
        <li>
          <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Abrir o Instagram da loja" title="Instagram" className={`${base} ${instagramStyle}`}>
            <InstagramIcon />
          </a>
        </li>
      )}
    </ul>
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
  return <SocialLinksView whatsapp={whatsapp} instagram={instagram} className={className} />;
}
