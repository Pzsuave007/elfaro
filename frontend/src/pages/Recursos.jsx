import ContentListPage from "@/components/ContentListPage";

export default function Recursos() {
  return (
    <ContentListPage
      kind="resources" route="/recursos" title="Recursos para la comunidad"
      subtitle="Programas de vivienda, salud, empleo, educación, asistencia legal y más, con información verificada."
      categoriesKey="resource_categories" cardType="resource"
    />
  );
}
