import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiError } from "@/lib/api";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1530563937443-1f02f662fa5c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative"><Logo light /></div>
        <div className="relative">
          <h1 className="font-serif text-4xl font-bold leading-tight">Portal Editorial</h1>
          <p className="mt-3 text-primary-foreground/80 max-w-sm">Gestiona noticias, recursos, leyes, lugares y elecciones con apoyo del asistente de AI editorial.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="login-form">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h2 className="font-serif text-3xl font-bold">Iniciar sesión</h2>
          <p className="mt-1 text-muted-foreground text-sm">Accede al panel de administración.</p>

          {error && <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive" data-testid="login-error">{error}</div>}

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 h-11" data-testid="login-email" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5 h-11" data-testid="login-password" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="mt-6 w-full h-11" data-testid="login-submit">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
