import { useEffect } from "react";
import { api } from "@/lib/api";
import { applyPalette, DEFAULT_PALETTE } from "@/lib/palettes";

// Fetches the saved palette once and applies it site-wide (public + admin).
export default function ThemeApplier() {
  useEffect(() => {
    api.get("/site-settings")
      .then((r) => applyPalette(r.data?.palette || DEFAULT_PALETTE))
      .catch(() => applyPalette(DEFAULT_PALETTE));
  }, []);
  return null;
}
