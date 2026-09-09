import ContentListPage from "@/components/ContentListPage";

export default function Enterate() {
  return (
    <ContentListPage
      kind="articles" route="/enterate" title="Entérate"
      subtitle="Noticias, análisis, entrevistas y opinión sobre Oregon y nuestra comunidad."
      categoriesKey="article_categories" cardType="article"
    />
  );
}
