import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";
import { roleLandingPath } from "../utils/format";

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) return <Navigate to={roleLandingPath(user.role)} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const authenticatedUser = await login(username.trim(), password);
      toast.success("Bienvenido al restaurante");
      navigate(roleLandingPath(authenticatedUser.role), { replace: true });
    } catch (error) {
      toast.error("No se pudo iniciar sesión", {
        description: getApiErrorMessage(error, "Verifica tu usuario y contraseña e inténtalo nuevamente."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-navy px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-24 -top-28 size-[450px] rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-12 size-[310px] rounded-full border border-white/10" />
        <Brand inverse />
        <div className="relative max-w-xl py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Restaurante Periquito</p>
          <h1 className="mt-5 text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">Cada mesa, una buena experiencia.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65">Accede al espacio de gestión del restaurante y acompaña cada servicio desde un solo lugar.</p>
        </div>
        <p className="text-xs text-white/45">Sistema interno de operación · Periquito</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <div className="surface-card px-6 py-8 sm:px-9 sm:py-10">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">Bienvenido</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">Iniciar sesión</h2>
              <p className="mt-2 text-sm text-slate-500">Ingresa con tu cuenta de Periquito.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Usuario
                <span className="relative mt-2 block">
                  <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input autoComplete="username" className="field-input block !pl-12" onChange={(event) => setUsername(event.target.value)} placeholder="Tu usuario" required value={username} />
                </span>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Contraseña
                <span className="relative mt-2 block">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input autoComplete="current-password" className="field-input block !pl-12 !pr-12" onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" required type={showPassword ? "text" : "password"} value={password} />
                  <button aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy" onClick={() => setShowPassword((show) => !show)} type="button">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <button className="button-primary mt-2 w-full py-3" disabled={submitting} type="submit">
                {submitting ? "Verificando acceso…" : "Entrar al sistema"}
              </button>
            </form>
            <p className="mt-6 text-center text-xs leading-5 text-slate-400">La sesión se pierde al recargar o cerrar esta página.</p>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} Restaurante Periquito</p>
        </div>
      </section>
    </main>
  );
}
