import type { DefaultSession } from "next-auth";
import type { Rol } from "@/lib/roles";

// Agrega id y rol a la sesión y al token de Auth.js.
declare module "next-auth" {
  interface Session {
    user: { id: string; rol: Rol } & DefaultSession["user"];
  }
  interface User {
    rol?: Rol;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
  }
}
