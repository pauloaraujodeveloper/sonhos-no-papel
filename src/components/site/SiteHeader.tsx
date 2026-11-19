import { listCategories } from "@/lib/catalog/queries";
import { Header } from "./Header";

/** Cabeçalho com as categorias do banco no menu. */
export async function SiteHeader() {
  const categories = await listCategories();
  return <Header categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />;
}
