"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
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
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/notifications/actions";

function notificationHref(notification: AppNotification) {
  if (notification.href) return notification.href;
  if (notification.hr_case_id) return `/dossiers/${notification.hr_case_id}`;
  if (notification.client_id) return `/clients/${notification.client_id}`;
  return "/notifications";
}

export function NotificationsMenu({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => n.status === "non_lue").length;
  const currentUnread = items.filter((n) => n.status === "non_lue").length;

  function openNotification(notification: AppNotification) {
    setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, status: "lue" } : item)));
    startTransition(async () => {
      await markNotificationReadAction(notification.id);
      router.push(notificationHref(notification));
      router.refresh();
    });
  }

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, status: "lue" })));
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {currentUnread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {currentUnread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {currentUnread > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="size-3" /> Tout marquer comme lu
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            items.slice(0, 6).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className="flex w-full flex-col gap-0.5 px-2 py-2 text-left text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                {n.status === "non_lue" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                <span className="font-medium">{n.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{n.message}</span>
              <span className="text-[11px] text-muted-foreground">{formatRelative(n.created_at)}</span>
            </button>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <Link href="/taches" className="block px-2 py-1.5 text-center text-xs font-medium text-primary hover:underline">
          Voir les éléments à traiter
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
