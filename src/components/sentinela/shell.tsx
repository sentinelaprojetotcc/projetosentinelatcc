import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { accessibilityPreferencesFn } from "@/lib/auth";
import { applyAccessibilityPreferences } from "@/lib/accessibility";
import { listRecordsFn } from "@/lib/records";

export type NavItem = { label: string; to: string; icon: ReactNode };

export function AppShell({
  nav,
  children,
  title,
  meta,
  user,
  showHeaderNotifications = true,
}: {
  nav: NavItem[];
  children: ReactNode;
  title: string;
  meta?: string;
  user: { name: string; role: string; initials: string };
  showHeaderNotifications?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { accessibilityPreferencesFn().then(applyAccessibilityPreferences).catch(() => undefined); }, [user.name]);
  useEffect(() => {
    if (!showHeaderNotifications) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const notifications = await listRecordsFn({ data: { kind: "notifications" } });
        if (!cancelled) setUnreadNotifications(notifications.filter((item) => item.status === "Nova").length);
      } catch { if (!cancelled) setUnreadNotifications(0); }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [showHeaderNotifications, path]);

  const navList = (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = path === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <span className={cn("shrink-0", active && "text-primary")}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Logo size={30} subtitle={title} />
        <div className="mt-8 flex-1">{navList}</div>
        <div className="mt-6 rounded-lg border border-sidebar-border p-3 text-xs text-muted-foreground">
          Sessão segura · registro auditado
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setOpen(false)} />
          <aside className="relative z-10 flex w-72 flex-col border-r border-sidebar-border bg-sidebar p-4">
            <div className="flex items-center justify-between">
              <Logo size={28} subtitle={title} />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">{navList}</div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5 text-muted-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-medium text-foreground">{user.name}</p>
            {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
          </div>
          {showHeaderNotifications && (
            <Button asChild variant="ghost" size="icon" aria-label={unreadNotifications ? `Notificações: ${unreadNotifications} não lidas` : "Notificações"}>
              <Link to="/org/notificacoes">
                <span className="relative">
                  <Bell className="size-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </span>
              </Link>
            </Button>
          )}
          <div className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-primary/12 text-xs font-semibold text-primary">
            {user.initials}
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
