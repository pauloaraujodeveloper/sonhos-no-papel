import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export default function LojaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
