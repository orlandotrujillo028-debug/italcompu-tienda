import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cerrarSesion } from "@/app/(auth)/actions";
import { getUsuarioActual } from "@/lib/auth-guards";
import { nombreRol, panelPorRol } from "@/lib/roles";

/**
 * Menú de usuario del header.
 * Sin sesión: "Ingresar". Con sesión: nombre, "Mi panel" según el rol y "Cerrar sesión".
 */
export async function UserMenu({ tono = "claro" }: { tono?: "claro" | "oscuro" }) {
  const usuario = await getUsuarioActual();
  const colorTexto = tono === "oscuro" ? "text-white hover:bg-white/10 hover:text-white" : "text-marca-navy";

  if (!usuario) {
    return (
      <Button asChild variant="ghost" className={colorTexto}>
        <Link href="/login">
          <User />
          Ingresar
        </Link>
      </Button>
    );
  }

  const primerNombre = (usuario.name ?? usuario.email).split(" ")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={colorTexto}>
          <span className="flex size-6 items-center justify-center rounded-full bg-marca-cyan text-xs font-bold text-white">
            {primerNombre.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-32 truncate">{primerNombre}</span>
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium text-foreground">{usuario.name ?? "Mi cuenta"}</p>
          <p className="truncate text-xs text-marca-gris">{usuario.email}</p>
          <p className="mt-1 text-xs font-medium text-marca-azul">{nombreRol[usuario.rol]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={panelPorRol(usuario.rol)}>
            <LayoutDashboard />
            Mi panel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={cerrarSesion}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
