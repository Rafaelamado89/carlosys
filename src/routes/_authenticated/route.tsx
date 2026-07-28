import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { LayoutDashboard, Wrench, Package, FileText, BookOpen, LogOut, Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  ),
});

const NAV = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/work-orders", label: "Registos", icon: Wrench },
  { to: "/parts", label: "Peças", icon: Package },
  { to: "/invoices", label: "Orçamentos", icon: FileText },
] as const;

function Shell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [path]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r flex flex-col transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary grid place-items-center shrink-0">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate">Workshop ERP</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Gestão da Oficina</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path === to || path.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </button>
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      {open && (
        <div className="no-print fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print lg:hidden sticky top-0 z-20 h-14 bg-card border-b flex items-center justify-between px-4">
          <button onClick={() => setOpen((v) => !v)} className="p-2 -ml-2">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="font-semibold">Workshop ERP</div>
          <div className="w-9" />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
