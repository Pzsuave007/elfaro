import ContentListPage from "@/components/ContentListPage";

export default function ConoceOregon() {
  return (
    <ContentListPage
      kind="places" route="/conoce-oregon" title="Conoce Oregon"
      subtitle="Parques, historia, ciudades, museos e instituciones públicas del estado."
      categoriesKey="place_categories" cardType="place"
    />
  );
}
