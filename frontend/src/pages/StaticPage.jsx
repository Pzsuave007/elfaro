import { useParams } from "react-router-dom";

const PAGES = {
  acerca: {
    title: "Acerca de nosotros",
    body: [
      "El Foro In Oregon es una plataforma informativa en español dedicada a ayudar a nuestra comunidad a comprender mejor Oregon, sus recursos, sus instituciones y los temas que afectan nuestra vida cotidiana.",
      "Nuestra misión es ayudar a la comunidad hispanohablante a vivir, participar y entender mejor Oregon mediante información clara sobre noticias, recursos comunitarios, leyes, gobierno, elecciones y lugares importantes del estado.",
      "Creemos en la información verificable, neutral y accesible. Separamos claramente las noticias, las opiniones y el contenido patrocinado.",
    ],
  },
  "politica-editorial": {
    title: "Nuestra Política Editorial",
    body: [
      "El Foro In Oregon es una plataforma informativa en español dedicada a ayudar a nuestra comunidad a comprender mejor Oregon, sus recursos, sus instituciones y los temas que afectan nuestra vida cotidiana.",
      "En asuntos públicos y políticos buscamos presentar diferentes perspectivas de manera clara y respetuosa, dando espacio a distintas voces para que nuestros lectores puedan informarse y formar sus propias opiniones.",
      "Cuando presentamos candidatos o asuntos electorales buscamos utilizar criterios consistentes, preguntas equivalentes y fuentes identificadas.",
      "Las noticias, opiniones y contenidos patrocinados estarán claramente identificados.",
    ],
  },
  correcciones: {
    title: "Correcciones",
    body: [
      "La credibilidad es fundamental para nosotros. Cuando cometemos un error, lo corregimos de manera transparente.",
      "Cada artículo corregido muestra claramente la fecha de la corrección, qué fue corregido y una explicación.",
      "Si detectas un error en nuestro contenido, escríbenos a correcciones@elforo.org.",
    ],
  },
  contacto: {
    title: "Contacto",
    body: [
      "¿Tienes una pregunta, sugerencia o quieres compartir información sobre un recurso comunitario? Escríbenos.",
      "Correo general: hola@elforo.org",
      "Recursos comunitarios: recursos@elforo.org",
      "Correcciones: correcciones@elforo.org",
    ],
  },
  privacidad: {
    title: "Política de Privacidad",
    body: [
      "Respetamos tu privacidad. Recopilamos únicamente información básica y anónima de uso para mejorar nuestro contenido, como páginas vistas y búsquedas populares.",
      "No vendemos ni compartimos tu información personal con terceros.",
      "No es necesario crear una cuenta para acceder a nuestro contenido informativo.",
    ],
  },
  terminos: {
    title: "Términos de Uso",
    body: [
      "El contenido de El Foro In Oregon tiene fines informativos y educativos. No constituye asesoría legal, médica ni financiera.",
      "Para asuntos legales, electorales, de salud, gobierno o asistencia pública, te recomendamos siempre consultar las fuentes oficiales enlazadas en cada artículo.",
      "Nos esforzamos por mantener la información actualizada y verificada, pero te sugerimos confirmar los detalles con la fuente oficial.",
    ],
  },
};

export default function StaticPage({ page }) {
  const data = PAGES[page];
  if (!data) return null;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20" data-testid={`static-${page}`}>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">{data.title}</h1>
      <div className="mt-8 space-y-5">
        {data.body.map((p, i) => <p key={i} className="text-lg text-foreground/80 leading-relaxed">{p}</p>)}
      </div>
    </div>
  );
}
