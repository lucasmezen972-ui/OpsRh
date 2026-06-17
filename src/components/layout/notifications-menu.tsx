"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export function NotificationsMenu({ notifications }: { notifications: AppNotification[] }) {
  const unread = notifications.filter((n) => n.status === "non_lue").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread > 0 && <span className="text-xs font-normal text-muted-foreground">{unread} non lues</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-auto">
          {notifications.slice(0, 6).map((n) => (
            <div
              key={n.id}
              className="flex flex-col gap-0.5 px-2 py-2 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                {n.status === "non_lue" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                <span className="font-medium">{n.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{n.message}</span>
              <span className="text-[11px] text-muted-foreground">{formatRelative(n.created_at)}</span>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <Link href="/dashboard" className="block px-2 py-1.5 text-center text-xs font-medium text-primary hover:underline">
          Voir le tableau de bord
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
