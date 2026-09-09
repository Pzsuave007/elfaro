import { Link } from "react-router-dom";
import { Mountain } from "lucide-react";

export function Logo({ className = "", compact = false, light = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`} data-testid="site-logo">
      <span className={`grid place-items-center rounded-lg p-1.5 ${light ? "bg-white/15" : "bg-primary"} transition-transform group-hover:scale-105`}>
        <Mountain className={`h-5 w-5 ${light ? "text-white" : "text-primary-foreground"}`} strokeWidth={2.2} />
      </span>
      <span className="leading-[0.95]">
        <span className={`block font-serif font-bold tracking-tight ${compact ? "text-base" : "text-lg"} ${light ? "text-white" : "text-foreground"}`}>
          EL FORO
        </span>
        <span className={`block font-sans font-semibold tracking-[0.25em] text-[10px] ${light ? "text-white/70" : "text-primary"}`}>
          IN OREGON
        </span>
      </span>
    </Link>
  );
}
