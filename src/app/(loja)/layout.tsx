import { Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ThemeStyle } from "@/components/site/ThemeStyle";

export default function LojaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <ThemeStyle />
      </Suspense>
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
