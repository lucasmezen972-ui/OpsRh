"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, SECONDARY_NAV } from "./nav";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const renderItem = (item: (typeof MAIN_NAV)[number]) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-slate-600 hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="size-[18px] shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
          O
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Ops RH</p>
          <p className="text-[11px] text-muted-foreground">Cockpit freelance RH</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pilotage
        </p>
        {MAIN_NAV.map(renderItem)}

        <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Configuration
        </p>
        {SECONDARY_NAV.map(renderItem)}
      </nav>
    </div>
  );
}
