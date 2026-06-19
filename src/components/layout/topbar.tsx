"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, X, LogOut, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "./sidebar";
import { NotificationsMenu } from "./notifications-menu";
import { initials } from "@/lib/utils";
import { logout } from "@/app/login/actions";
import type { AppNotification, Profile } from "@/lib/types";

export function Topbar({
  profile,
  notifications,
}: {
  profile: Profile;
  notifications: AppNotification[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </Button>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-1">
          <NotificationsMenu notifications={notifications} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar>
                  <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">{profile.company_name}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{profile.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/parametres">
                  <User /> Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/parametres">
                  <Building2 /> Mon entreprise
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <LogOut /> Se déconnecter
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r bg-background shadow-xl">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu">
                <X className="size-5" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
}

function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Recherche indisponible");
        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
        setActiveIndex(0);
        setOpen(true);
      } catch (error) {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function navigate(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(query.length >= 2)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
            return;
          }
          if (!open || results.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % results.length);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + results.length) % results.length);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            navigate(results[activeIndex]);
          }
        }}
        placeholder="Rechercher un client, un dossier..."
        className="pl-9"
        aria-label="Recherche globale"
        aria-expanded={open}
        aria-controls="global-search-results"
      />
      {query.trim().length >= 2 && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border bg-popover shadow-lg"
        >
          <div className="max-h-80 overflow-auto p-1">
            {loading ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Recherche en cours...</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Aucun résultat trouvé.</p>
            ) : (
              results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => navigate(result)}
                >
                  <span className="mt-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {result.type}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{result.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
