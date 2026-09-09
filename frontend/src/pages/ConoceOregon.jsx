import ContentListPage from "@/components/ContentListPage";

const GROUPS = [
  { label: "Naturaleza", categories: ["Parques estatales", "Recursos naturales"], subs: ["Parques estatales", "Recursos naturales"] },
  { label: "Cultura e Historia", categories: ["Historia", "Museos", "Lugares culturales"], subs: ["Historia", "Museos", "Lugares culturales"] },
  { label: "Ciudades", categories: ["Ciudades"] },
  { label: "Lugares importantes", categories: ["Lugares importantes"] },
];

export default function ConoceOregon() {
  return (
    <ContentListPage
      kind="places" route="/conoce-oregon" title="Conoce Oregon"
      subtitle="Parques, historia, ciudades, museos e instituciones públicas del estado."
      categoriesKey="place_categories" cardType="place" groups={GROUPS}
    />
  );
}
