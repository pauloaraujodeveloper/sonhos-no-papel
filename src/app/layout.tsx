import type { Metadata, Viewport } from "next";
import { Nunito, Quicksand } from "next/font/google";
import "./globals.css";

const corpo = Nunito({
  variable: "--font-corpo",
  subsets: ["latin"],
  display: "swap",
});

const titulo = Quicksand({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const siteName = "Sonhos no Papel";
const siteDescription =
  "Papelaria com canetas, lápis, agendas, cadernos e pincéis escolhidos com carinho.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  icons: {
    icon: "/brand/simbolo.png",
    apple: "/brand/simbolo.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    title: siteName,
    description: siteDescription,
    images: ["/brand/simbolo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#bde3f6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
