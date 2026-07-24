import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PART_STATUS_CLASS, PART_STATUS_LABEL, money, type PartRequest } from "@/lib/workshop";
import { ExternalLink, Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/parts/")({
  head: () => ({
    meta: [
      { title: "Parts · Workshop ERP" },
      { name: "description", content: "External parts sourcing and order tracking." },
    ],
  }),
  component: PartsList,
});

function PartsList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["parts_requests", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parts_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as PartRequest[];
    },
  });

  const filtered = data.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return p.part_name.toLowerCase().includes(s) ||
      (p.part_code ?? "").toLowerCase().includes(s) ||
      (p.motorcycle_model ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Encomendas de Peças</h1>
          <p className="text-muted-foreground mt-1">Gestão e controlo de peças encomendadas</p>
        </div>
        <Link to="/parts/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Encomendar Peça
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Pesquisar peça, código ou modelo…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-md border bg-background" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
          <option value="all">Todos os estados</option>
          {Object.entries(PART_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhuma encomenda de peça encontrada.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((p) => {
              const margin = (Number(p.selling_price) - Number(p.cost_price)) * Number(p.quantity);
              return (
                <div key={p.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to="/parts/$id" params={{ id: p.id }} className="font-medium hover:underline block truncate">
                      {p.part_name}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.part_code && <span className="font-mono">{p.part_code}</span>}
                      {p.motorcycle_model && <span> · {p.motorcycle_model}</span>}
                      {" · Qtd "}{p.quantity}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right text-sm">
                    <div className="text-muted-foreground text-xs">Custo / Venda</div>
                    <div className="font-mono">{money(Number(p.cost_price))} → {money(Number(p.selling_price))}</div>
                  </div>
                  <div className="hidden md:block text-right text-sm">
                    <div className="text-muted-foreground text-xs">Lucro</div>
                    <div className={`font-mono ${margin >= 0 ? "text-success" : "text-destructive"}`}>{money(margin)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.external_url && (
                      <a href={p.external_url} target="_blank" rel="noreferrer" className="p-2 rounded-md border hover:bg-muted" title="Abrir site do fornecedor">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PART_STATUS_CLASS[p.status]}`}>
                      {PART_STATUS_LABEL[p.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
