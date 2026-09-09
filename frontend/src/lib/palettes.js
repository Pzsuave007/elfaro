// Paletas de color seleccionables desde el admin. Cada una sobreescribe las
// variables CSS de marca (primary/secondary/accent/ring/terracotta/info) para
// modo claro y oscuro, sin tocar el resto del diseño editorial.

export const PALETTES = {
  green: {
    label: "Bosque (verde)",
    swatch: ["hsl(150 38% 17%)", "hsl(15 46% 55%)"],
    light: {
      primary: "150 38% 17%", "primary-foreground": "40 30% 97%",
      secondary: "40 26% 93%", "secondary-foreground": "150 38% 17%",
      accent: "150 14% 90%", "accent-foreground": "150 38% 17%",
      ring: "150 38% 17%", terracotta: "15 46% 55%", info: "205 45% 30%",
      "chart-1": "150 38% 22%", "chart-2": "15 46% 55%",
    },
    dark: { primary: "150 30% 55%", ring: "150 30% 55%", terracotta: "15 50% 60%", info: "205 45% 55%" },
  },
  ocean: {
    label: "Océano (azul)",
    swatch: ["hsl(212 55% 22%)", "hsl(28 70% 52%)"],
    light: {
      primary: "212 55% 22%", "primary-foreground": "210 30% 97%",
      secondary: "210 30% 93%", "secondary-foreground": "212 55% 22%",
      accent: "210 30% 90%", "accent-foreground": "212 55% 22%",
      ring: "212 55% 22%", terracotta: "28 70% 52%", info: "200 60% 35%",
      "chart-1": "212 55% 30%", "chart-2": "28 70% 52%",
    },
    dark: { primary: "210 55% 62%", ring: "210 55% 62%", terracotta: "28 75% 60%", info: "200 60% 60%" },
  },
  wine: {
    label: "Vino (borgoña)",
    swatch: ["hsl(348 55% 25%)", "hsl(38 65% 50%)"],
    light: {
      primary: "348 55% 25%", "primary-foreground": "350 30% 97%",
      secondary: "350 25% 93%", "secondary-foreground": "348 55% 25%",
      accent: "350 22% 90%", "accent-foreground": "348 55% 25%",
      ring: "348 55% 25%", terracotta: "38 65% 50%", info: "210 40% 35%",
      "chart-1": "348 55% 32%", "chart-2": "38 65% 50%",
    },
    dark: { primary: "348 50% 60%", ring: "348 50% 60%", terracotta: "38 70% 58%", info: "210 45% 60%" },
  },
  indigo: {
    label: "Noche (índigo)",
    swatch: ["hsl(245 45% 30%)", "hsl(8 65% 58%)"],
    light: {
      primary: "245 45% 30%", "primary-foreground": "245 30% 97%",
      secondary: "245 25% 93%", "secondary-foreground": "245 45% 30%",
      accent: "245 22% 90%", "accent-foreground": "245 45% 30%",
      ring: "245 45% 30%", terracotta: "8 65% 58%", info: "200 50% 35%",
      "chart-1": "245 45% 38%", "chart-2": "8 65% 58%",
    },
    dark: { primary: "245 55% 68%", ring: "245 55% 68%", terracotta: "8 70% 65%", info: "200 55% 62%" },
  },
  teal: {
    label: "Pacífico (teal)",
    swatch: ["hsl(185 55% 20%)", "hsl(20 70% 52%)"],
    light: {
      primary: "185 55% 20%", "primary-foreground": "185 30% 97%",
      secondary: "185 25% 92%", "secondary-foreground": "185 55% 20%",
      accent: "185 22% 89%", "accent-foreground": "185 55% 20%",
      ring: "185 55% 20%", terracotta: "20 70% 52%", info: "200 55% 32%",
      "chart-1": "185 55% 28%", "chart-2": "20 70% 52%",
    },
    dark: { primary: "185 45% 55%", ring: "185 45% 55%", terracotta: "20 75% 60%", info: "200 55% 60%" },
  },
  earth: {
    label: "Tierra (cálido)",
    swatch: ["hsl(20 25% 22%)", "hsl(15 60% 52%)"],
    light: {
      primary: "20 25% 22%", "primary-foreground": "30 30% 97%",
      secondary: "30 30% 92%", "secondary-foreground": "20 25% 22%",
      accent: "30 25% 89%", "accent-foreground": "20 25% 22%",
      ring: "20 25% 22%", terracotta: "15 60% 52%", info: "205 45% 32%",
      "chart-1": "20 25% 30%", "chart-2": "15 60% 52%",
    },
    dark: { primary: "25 25% 60%", ring: "25 25% 60%", terracotta: "15 60% 58%", info: "205 45% 58%" },
  },
};

export const DEFAULT_PALETTE = "green";

export function applyPalette(key) {
  const p = PALETTES[key] || PALETTES[DEFAULT_PALETTE];
  const lines = [];
  const light = Object.entries(p.light).map(([k, v]) => `--${k}: ${v};`).join(" ");
  const dark = Object.entries(p.dark).map(([k, v]) => `--${k}: ${v};`).join(" ");
  lines.push(`:root{${light}}`);
  lines.push(`.dark{${dark}}`);
  let style = document.getElementById("foro-palette");
  if (!style) {
    style = document.createElement("style");
    style.id = "foro-palette";
    document.head.appendChild(style);
  }
  style.textContent = lines.join("\n");
}
