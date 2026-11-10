import {
  AppWindow,
  Armchair,
  Backpack,
  BatteryCharging,
  Cable,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  House,
  Laptop,
  LayoutGrid,
  Monitor,
  MonitorSmartphone,
  Mouse,
  Printer,
  Router,
  Server,
  Smartphone,
  Tv,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { siFacebook, siInstagram, siTiktok, siWhatsapp, type SimpleIcon } from "simple-icons";

// Icono de cada categoría (el nombre se guarda en Category.icono).
const ICONOS_CATEGORIA: Record<string, LucideIcon> = {
  monitor: Monitor,
  laptop: Laptop,
  cpu: Cpu,
  "hard-drive": HardDrive,
  mouse: Mouse,
  "monitor-smartphone": MonitorSmartphone,
  printer: Printer,
  smartphone: Smartphone,
  tv: Tv,
  "battery-charging": BatteryCharging,
  headphones: Headphones,
  router: Router,
  server: Server,
  "app-window": AppWindow,
  "gamepad-2": Gamepad2,
  house: House,
  cable: Cable,
  backpack: Backpack,
  wrench: Wrench,
  armchair: Armchair,
};

export function IconoCategoria({ nombre, className }: { nombre?: string | null; className?: string }) {
  const Icono = (nombre && ICONOS_CATEGORIA[nombre]) || LayoutGrid;
  return <Icono className={className} aria-hidden />;
}

// Logos de redes sociales (simple-icons, licencia CC0).
const MARCAS = { whatsapp: siWhatsapp, instagram: siInstagram, facebook: siFacebook, tiktok: siTiktok } satisfies Record<string, SimpleIcon>;

export function IconoMarca({ marca, className }: { marca: keyof typeof MARCAS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={MARCAS[marca].path} />
    </svg>
  );
}
