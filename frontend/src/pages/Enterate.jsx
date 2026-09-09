import ContentListPage from "@/components/ContentListPage";

// "Gobierno" agrupa todo lo gubernamental (Gobierno, Política, Elecciones) con sub-tabs.
const GROUPS = [
  { label: "Oregon", categories: ["Oregon"] },
  { label: "Gobierno", categories: ["Gobierno", "Política", "Elecciones"], subs: ["Gobierno", "Política", "Elecciones"] },
  { label: "Comunidad", categories: ["Comunidad"] },
  { label: "Educación", categories: ["Educación"] },
  { label: "Economía", categories: ["Economía"] },
  { label: "Inmigración", categories: ["Inmigración"] },
  { label: "Vivienda", categories: ["Vivienda"] },
  { label: "Salud", categories: ["Salud"] },
  { label: "Seguridad", categories: ["Seguridad"] },
];

export default function Enterate() {
  return (
    <ContentListPage
      kind="articles" route="/historias" title="Historias de la comunidad"
      subtitle="Historias, guías y perspectivas de nuestra comunidad en Oregon. Contenido que no caduca."
      categoriesKey="article_categories" cardType="article" groups={GROUPS}
    />
  );
}
