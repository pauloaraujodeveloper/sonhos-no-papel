import { Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ThemeStyle } from "@/components/site/ThemeStyle";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

export default function LojaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <ThemeStyle />
      </Suspense>
      <Suspense fallback={<Header />}>
        <SiteHeader />
      </Suspense>
      <div id="conteudo" className="flex flex-1 flex-col">
        {children}
      </div>
      <Footer />
      <Suspense fallback={null}>
        <WhatsAppFab />
      </Suspense>
    </>
  );
}
