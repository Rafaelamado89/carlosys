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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Workshop overview</p>
        </div>
        <Link
          to="/work-orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New work order</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Wrench} label="Active repairs" value={active.length.toString()} />
        <StatCard icon={Package} label="Parts open" value={parts.length.toString()} />
        <StatCard icon={TrendingUp} label="Parts value" value={money(partsValue)} />
        <StatCard icon={FileText} label="Invoices" value={invoices.length.toString()} sub="recent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Active work orders</h2>
            <Link to="/work-orders" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {active.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No active work orders.</div>
            )}
            {active.slice(0, 8).map((o) => (
              <Link
                key={o.id}
                to="/work-orders/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.client_name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {o.motorcycle_make} {o.motorcycle_model}
                    {o.license_plate && <span className="ml-2 font-mono text-xs">· {o.license_plate}</span>}
                  </div>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${WO_STATUS_CLASS[o.status]}`}>
                  {WO_STATUS_LABEL[o.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent invoices</h2>
            <Link to="/invoices" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {invoices.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No invoices yet.</div>
            )}
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                to="/invoices/$id"
                params={{ id: inv.id }}
                className="block p-4 hover:bg-muted/50"
              >
                <div className="font-mono text-xs text-primary">{inv.invoice_number}</div>
                <div className="text-sm font-medium truncate mt-0.5">{inv.client_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(inv.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
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
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-2xl lg:text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
