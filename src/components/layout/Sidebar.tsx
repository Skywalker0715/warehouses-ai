"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Warehouse,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produk", href: "/dashboard/products", icon: Package },
  { label: "Gudang", href: "/dashboard/warehouses", icon: Warehouse },
  { label: "Manajemen Stok", href: "/dashboard/stock", icon: ClipboardList },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-blue-950">
      <div className="border-b border-blue-900 px-4 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-400" />
          <span className="text-base font-bold text-white">Warehouse AI</span>
        </div>
        <p className="mt-1 text-xs text-blue-400">Powered by Claude AI</p>
      </div>

      <div className="flex flex-1 flex-col px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          MENU UTAMA
        </p>
        <nav className="mt-3 space-y-1">
          {MAIN_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-blue-600 font-medium text-white"
                    : "text-blue-200 hover:bg-blue-900 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-blue-900 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          LAINNYA
        </p>
        <nav className="mt-3 space-y-1">
          {BOTTOM_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-blue-600 font-medium text-white"
                    : "text-blue-200 hover:bg-blue-900 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
