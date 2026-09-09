import ContentListPage from "@/components/ContentListPage";

const GROUPS = [
  { label: "Gobierno", categories: ["Gobierno", "Impuestos", "Servicios públicos", "Elecciones"], subs: ["Gobierno", "Impuestos", "Servicios públicos", "Elecciones"] },
  { label: "Leyes y Derechos", categories: ["Leyes", "Derechos"], subs: ["Leyes", "Derechos"] },
  { label: "Tránsito", categories: ["Tránsito", "Licencias"], subs: ["Tránsito", "Licencias"] },
  { label: "Trabajo", categories: ["Trabajo"] },
  { label: "Vivienda", categories: ["Vivienda"] },
  { label: "Educación", categories: ["Educación"] },
  { label: "Salud", categories: ["Salud"] },
];

export default function OregonTeInforma() {
  return (
    <ContentListPage
      kind="oregon-info" route="/oregon-te-informa" title="Oregon Te Informa"
      subtitle="Leyes, gobierno, impuestos y derechos explicados en lenguaje sencillo."
      categoriesKey="oregon_info_categories" cardType="oregon-info" groups={GROUPS}
    />
  );
}
