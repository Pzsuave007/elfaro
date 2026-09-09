import ContentListPage from "@/components/ContentListPage";

const GROUPS = [
  { label: "Vivienda", categories: ["Vivienda", "Renta"], subs: ["Vivienda", "Renta"] },
  { label: "Salud", categories: ["Salud", "Salud mental"], subs: ["Salud", "Salud mental"] },
  { label: "Familias", categories: ["Familias", "Niños", "Adultos mayores"], subs: ["Familias", "Niños", "Adultos mayores"] },
  { label: "Alimentos", categories: ["Alimentos"] },
  { label: "Empleo", categories: ["Empleo"] },
  { label: "Educación", categories: ["Educación"] },
  { label: "Inmigración", categories: ["Inmigración"] },
  { label: "Asistencia legal", categories: ["Asistencia legal"] },
  { label: "Transporte", categories: ["Transporte"] },
  { label: "Servicios públicos", categories: ["Servicios públicos"] },
  { label: "Instituciones públicas", categories: ["Instituciones públicas"] },
  { label: "Programas estatales", categories: ["Programas estatales"] },
  { label: "Emergencias", categories: ["Emergencias"] },
];

export default function Recursos() {
  return (
    <ContentListPage
      kind="resources" route="/recursos" title="Recursos para la comunidad"
      subtitle="Programas de vivienda, salud, empleo, educación, asistencia legal y más, con información verificada."
      categoriesKey="resource_categories" cardType="resource" groups={GROUPS}
    />
  );
}
