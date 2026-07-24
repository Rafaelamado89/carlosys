import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WO_STATUS_CLASS, WO_STATUS_LABEL, money, type WorkOrder, type Invoice, type PartRequest } from "@/lib/workshop";
import { Wrench, Package, FileText, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Workshop ERP" },
      { name: "description", content: "Active work orders, pending parts and recent invoices at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["work_orders", "dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WorkOrder[];
    },
  });

  const { data: parts = [] } = useQuery({
    queryKey: ["parts_requests", "dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_requests")
        .select("*")
        .in("status", ["pending", "ordered", "shipped"]);
      if (error) throw error;
      return data as PartRequest[];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", "dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const active = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const partsValue = parts.reduce((s, p) => s + Number(p.cost_price) * Number(p.quantity), 0);

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-950 text-emerald-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Dashboard</h1>
            <p className="text-emerald-300/80 text-sm mt-1">Visão geral da oficina</p>
          </div>
          <Link
            to="/work-orders/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-emerald-950 font-bold shadow-lg shadow-emerald-950/50 hover:bg-emerald-400 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova folha de obra</span>
            <span className="sm:hidden">Nova</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Wrench} label="Reparações ativas" value={active.length.toString()} />
          <StatCard icon={Package} label="Peças em aberto" value={parts.length.toString()} />
          <StatCard icon={TrendingUp} label="Valor de peças" value={money(partsValue)} />
          <StatCard icon={FileText} label="Orçamentos" value={invoices.length.toString()} sub="recentes" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-emerald-950/60 backdrop-blur-md border border-emerald-500/20 rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-900/30">
              <h2 className="font-semibold text-white">Folhas de obra ativas</h2>
              <Link to="/work-orders" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium hover:underline">Ver todas</Link>
            </div>
            <div className="divide-y divide-emerald-500/10">
              {active.length === 0 && (
                <div className="p-8 text-center text-emerald-300/60 text-sm">Sem folhas de obra ativas.</div>
              )}
              {active.slice(0, 8).map((o) => (
                <Link
                  key={o.id}
                  to="/work-orders/$id"
                  params={{ id: o.id }}
                  className="flex items-center justify-between p-4 hover:bg-emerald-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{o.client_name}</div>
                    <div className="text-sm text-emerald-300/80 truncate">
                      {o.motorcycle_make} {o.motorcycle_model}
                      {o.license_plate && <span className="ml-2 font-mono text-xs text-emerald-400">· {o.license_plate}</span>}
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${WO_STATUS_CLASS[o.status]}`}>
                    {WO_STATUS_LABEL[o.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-emerald-950/60 backdrop-blur-md border border-emerald-500/20 rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-900/30">
              <h2 className="font-semibold text-white">Orçamentos recentes</h2>
              <Link to="/invoices" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium hover:underline">Ver todos</Link>
            </div>
            <div className="divide-y divide-emerald-500/10">
              {invoices.length === 0 && (
                <div className="p-8 text-center text-emerald-300/60 text-sm">Sem orçamentos registados.</div>
              )}
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  to="/invoices/$id"
                  params={{ id: inv.id }}
                  className="block p-4 hover:bg-emerald-800/30 transition-colors"
                >
                  <div className="font-mono text-xs text-emerald-400 font-semibold">{inv.invoice_number}</div>
                  <div className="text-sm font-medium text-white truncate mt-0.5">{inv.client_name}</div>
                  <div className="text-xs text-emerald-300/60">
                    {new Date(inv.created_at).toLocaleDateString("pt-PT")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-emerald-900/40 backdrop-blur-md border border-emerald-500/20 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-emerald-300/80 font-semibold">{label}</span>
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="text-2xl lg:text-3xl font-extrabold text-white">{value}</div>
      {sub && <div className="text-xs text-emerald-400/80 mt-1">{sub}</div>}
    </div>
  );
}
