import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WO_STATUS_CLASS, WO_STATUS_LABEL, type WorkOrder } from "@/lib/workshop";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/work-orders/")({
  head: () => ({
    meta: [
      { title: "Work orders · Workshop ERP" },
      { name: "description", content: "All motorcycle work orders and their status." },
    ],
  }),
  component: WorkOrdersList,
});

function WorkOrdersList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["work_orders", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as WorkOrder[];
    },
  });

  const filtered = data.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      o.client_name.toLowerCase().includes(s) ||
      o.motorcycle_make.toLowerCase().includes(s) ||
      o.motorcycle_model.toLowerCase().includes(s) ||
      (o.license_plate ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Folhas de Obra</h1>
          <p className="text-muted-foreground mt-1">{data.length} registos no total</p>
        </div>
        <Link
          to="/work-orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nova Folha de Obra
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Pesquisar por cliente, mota ou matrícula…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-background"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="all">Todos os estados</option>
          {Object.entries(WO_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-muted-foreground mb-3">Nenhuma folha de obra encontrada.</div>
            <Link to="/work-orders/new" className="text-primary hover:underline text-sm">Criar a primeira folha de obra</Link>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((o) => (
              <Link
                key={o.id}
                to="/work-orders/$id"
                params={{ id: o.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto] items-center gap-4 p-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.client_name}</div>
                  {o.client_phone && (
                    <div className="text-xs text-muted-foreground">{o.client_phone}</div>
                  )}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-sm truncate">{o.motorcycle_make} {o.motorcycle_model}</div>
                  {o.license_plate && (
                    <div className="font-mono text-xs text-muted-foreground">{o.license_plate}</div>
                  )}
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground">
                  {new Date(o.updated_at).toLocaleDateString("pt-PT")}
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${WO_STATUS_CLASS[o.status]}`}>
                  {WO_STATUS_LABEL[o.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
