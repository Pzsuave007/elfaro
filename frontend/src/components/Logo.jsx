import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const SIZES = { sm: "h-10", md: "h-14", lg: "h-24", xl: "h-32" };

export function Logo({ className = "", compact = false, light = false, size }) {
  const heightClass = SIZES[size] || (compact ? "h-10" : "h-14");
  return (
    <Link to="/" className={`inline-flex items-center group ${className}`} data-testid="site-logo" aria-label="El Faro en Oregón — Inicio">
      <img
        src={logo}
        alt="El Faro en Oregón"
        className={`w-auto object-contain transition-transform group-hover:scale-105 ${heightClass} ${light ? "brightness-0 invert opacity-90" : ""}`}
      />
    </Link>
  );
}
