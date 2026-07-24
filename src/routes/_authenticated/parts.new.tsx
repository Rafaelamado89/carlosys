import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PART_STATUS_LABEL, type WorkOrder } from "@/lib/workshop";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ workOrderId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/parts/new")({
  head: () => ({ meta: [{ title: "Nova peça · Workshop ERP" }] }),
  validateSearch: searchSchema,
  component: NewPart,
});

type Marketplace = {
  key: string;
  name: string;
  color: string;
  build: (q: string) => string;
};

const MARKETPLACES: Marketplace[] = [
  { key: "google", name: "Google Shopping", color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    build: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}` },
  { key: "ebay", name: "eBay", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    build: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}` },
  { key: "amazon", name: "Amazon.es", color: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    build: (q) => `https://www.amazon.es/s?k=${encodeURIComponent(q)}` },
  { key: "olx", name: "OLX Portugal", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    build: (q) => `https://www.olx.pt/ads/q-${encodeURIComponent(q.replace(/\s+/g, "-"))}/` },
  { key: "standvirtual", name: "Standvirtual", color: "bg-red-500/10 text-red-500 border-red-500/30",
    build: (q) => `https://www.standvirtual.com/motas/pecas?search%5Bfilter_float_price%3Afrom%5D=&search%5Bquery%5D=${encodeURIComponent(q)}` },
  { key: "mercadolivre", name: "Mercado Livre", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    build: (q) => `https://lista.mercadolivre.com.pt/${encodeURIComponent(q.replace(/\s+/g, "-"))}` },
];

function NewPart() {
  const nav = useNavigate();
  const { workOrderId } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    work_order_id: workOrderId ?? "",
    part_name: "",
    part_code: "",
    motorcycle_model: "",
    external_url: "",
    cost_price: 0,
    selling_price: 0,
    quantity: 1,
    status: "pending" as keyof typeof PART_STATUS_LABEL,
    notes: "",
  });

  const query = useMemo(() => {
    return [form.part_name, form.motorcycle_model, form.part_code].filter(Boolean).join(" ").trim();
  }, [form.part_name, form.motorcycle_model, form.part_code]);
  const hasQuery = query.length >= 2;

  const { data: orders = [] } = useQuery({
    queryKey: ["work_orders", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("id, client_name, motorcycle_make, motorcycle_model")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Pick<WorkOrder, "id" | "client_name" | "motorcycle_make" | "motorcycle_model">[];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: user } = await supabase.auth.getUser();
    const payload = {
      ...form,
      work_order_id: form.work_order_id || null,
      part_code: form.part_code || null,
      motorcycle_model: form.motorcycle_model || null,
      external_url: form.external_url || null,
      notes: form.notes || null,
      created_by: user.user?.id,
    };
    const { data, error } = await supabase.from("parts_requests").insert(payload).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Peça adicionada");
    nav({ to: "/parts/$id", params: { id: data!.id } });
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/parts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Nova peça</h1>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 space-y-5">
        <F label="Nome da peça" required>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              autoFocus
              placeholder="Ex.: filtro de óleo, kit transmissão…"
              value={form.part_name}
              onChange={(e) => setForm({ ...form, part_name: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-md border bg-background"
            />
          </div>
        </F>

        {/* Marketplace search */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Procurar no mercado</div>
            {hasQuery && <div className="text-xs text-muted-foreground truncate max-w-[60%]">“{query}”</div>}
          </div>
          {!hasQuery ? (
            <p className="text-sm text-muted-foreground">Escreva o nome da peça para procurar opções de compra.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MARKETPLACES.map((m) => (
                <a
                  key={m.key}
                  href={m.build(query)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => { if (!form.external_url) setForm((f) => ({ ...f, external_url: m.build(query) })); }}
                  className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm font-medium hover:opacity-80 ${m.color}`}
                >
                  <span>{m.name}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Clique num fornecedor para abrir os resultados. O primeiro que abrir fica gravado como URL do fornecedor abaixo — pode alterar.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Referência / OEM"><input value={form.part_code} onChange={(e) => setForm({ ...form, part_code: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
          <F label="Modelo da mota"><input value={form.motorcycle_model} onChange={(e) => setForm({ ...form, motorcycle_model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Quantidade"><input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Estado">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as keyof typeof PART_STATUS_LABEL })} className="w-full px-3 py-2 rounded-md border bg-background">
              {Object.entries(PART_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <F label="Preço de custo (€)"><input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Preço de venda (€)"><input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Ordem de reparação associada">
            <select value={form.work_order_id} onChange={(e) => setForm({ ...form, work_order_id: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background">
              <option value="">— Nenhuma —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.client_name} — {o.motorcycle_make} {o.motorcycle_model}</option>
              ))}
            </select>
          </F>
        </div>
        <F label="URL do fornecedor">
          <input type="url" placeholder="https://…" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" />
        </F>
        <F label="Notas"><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        <div className="flex gap-3">
          <button disabled={busy} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? "A guardar…" : "Criar peça"}
          </button>
          <Link to="/parts" className="px-5 py-2.5 rounded-md border font-medium hover:bg-muted">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}
