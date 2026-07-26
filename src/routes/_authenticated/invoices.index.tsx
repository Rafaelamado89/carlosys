import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, type Invoice, type InvoiceItem } from "@/lib/workshop";
import { Plus, Search, FileText } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({
    meta: [
      { title: "Orçamentos · Workshop ERP" },
      { name: "description", content: "Todos os orçamentos da oficina, prontos para imprimir em A4." },
    ],
  }),
  component: InvoicesList,
});

function InvoicesList() {
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["invoices", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Invoice & { invoice_items: InvoiceItem[] })[];
    },
  });

  const filtered = data.filter((inv) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return inv.invoice_number.toLowerCase().includes(s) ||
      (inv.client_name ?? "").toLowerCase().includes(s) ||
      (inv.motorcycle_info ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground mt-1">{data.length} no total</p>
        </div>
        <Link to="/invoices/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo orçamento
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Procurar por número, cliente ou mota…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-md border bg-background" />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <div className="text-muted-foreground mb-3">Ainda não há orçamentos.</div>
            <Link to="/invoices/new" className="text-primary hover:underline text-sm">Criar o primeiro</Link>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((inv) => {
              const subtotal = inv.invoice_items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
              const total = subtotal * (1 + Number(inv.vat_rate) / 100);
              return (
                <Link key={inv.id} to="/invoices/$id" params={{ id: inv.id }} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 p-4 hover:bg-muted/50">
                  <div className="font-mono text-sm text-primary font-semibold">{inv.invoice_number}</div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{inv.client_name || "Sem cliente"}</div>
                    {inv.motorcycle_info && <div className="text-xs text-muted-foreground truncate">{inv.motorcycle_info}</div>}
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString("pt-PT")}
                  </div>
                  <div className="font-mono font-semibold">{money(total)}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
