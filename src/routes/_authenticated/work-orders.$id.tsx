import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  WO_STATUS_CLASS, WO_STATUS_LABEL, PART_STATUS_CLASS, PART_STATUS_LABEL,
  money, formatLicensePlate, type WorkOrder, type PartRequest, type Invoice,
} from "@/lib/workshop";
import { ArrowLeft, ExternalLink, FileText, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/work-orders/$id")({
  head: () => ({ meta: [{ title: "Work order · Workshop ERP" }] }),
  component: WorkOrderDetail,
});

function WorkOrderDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: wo, isLoading } = useQuery({
    queryKey: ["work_order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data as WorkOrder;
    },
  });

  const { data: parts = [] } = useQuery({
    queryKey: ["work_order_parts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_requests")
        .select("*")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PartRequest[];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["work_order_invoices", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const [form, setForm] = useState<WorkOrder | null>(null);
  useEffect(() => { if (wo) setForm(wo); }, [wo]);

  if (isLoading || !form) return <div className="p-8 text-muted-foreground">A carregar…</div>;

  const save = async () => {
    const { error } = await supabase
      .from("work_orders")
      .update({
        client_name: form.client_name,
        client_phone: form.client_phone,
        motorcycle_make: form.motorcycle_make,
        motorcycle_model: form.motorcycle_model,
        license_plate: form.license_plate,
        status: form.status,
        notes: form.notes,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Alterações guardadas com sucesso");
    qc.invalidateQueries({ queryKey: ["work_order", id] });
    qc.invalidateQueries({ queryKey: ["work_orders", "list"] });
  };

  const remove = async () => {
    if (!confirm("Eliminar esta folha de obra?")) return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Folha de obra eliminada");
    nav({ to: "/work-orders" });
  };

  const createInvoice = async () => {
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        work_order_id: id,
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        moto_brand: form.motorcycle_make || null,
        moto_model: form.motorcycle_model || null,
        moto_plate: form.license_plate || null,
        obs: null,
        motorcycle_info: [form.motorcycle_make, form.motorcycle_model, form.license_plate].filter(Boolean).join(" · ") || null,
        created_by: user.user?.id,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);

    // Fetch and automatically add parts linked to this work order
    const { data: partsList } = await supabase
      .from("parts_requests")
      .select("*")
      .eq("work_order_id", id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (partsList && partsList.length > 0) {
      const itemsToInsert = partsList.map((p, idx) => ({
        invoice_id: data.id,
        item_type: "part" as const,
        description: p.part_name ?? "",
        quantity: p.quantity || 1,
        unit_price: Number(p.selling_price) || 0,
        discount: 0,
        position: idx,
      }));
      await supabase.from("invoice_items").insert(itemsToInsert);
      toast.success(`Orçamento criado com ${partsList.length} peça(s) adicionada(s)`);
    } else {
      toast.success("Orçamento criado");
    }

    nav({ to: "/invoices/$id", params: { id: data!.id } });
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link to="/work-orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar às folhas de obra
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight truncate">{form.client_name || "Sem cliente"}</h1>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${WO_STATUS_CLASS[form.status]}`}>
              {WO_STATUS_LABEL[form.status]}
            </span>
          </div>
          <p className="text-muted-foreground">
            {[form.motorcycle_make, form.motorcycle_model].filter(Boolean).join(" ") || "Sem mota"}
            {form.license_plate && <span className="ml-2 font-mono text-sm">· {form.license_plate}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={createInvoice} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
            <FileText className="h-4 w-4" /> Passar a Orçamento
          </button>
          <button onClick={remove} className="p-2 rounded-md border text-destructive hover:bg-destructive/10" aria-label="Eliminar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Dados da Folha de Obra</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Nome do cliente"><input value={form.client_name ?? ""} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
              <F label="Telefone"><input value={form.client_phone ?? ""} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
              <F label="Marca"><input value={form.motorcycle_make ?? ""} onChange={(e) => setForm({ ...form, motorcycle_make: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
              <F label="Modelo"><input value={form.motorcycle_model ?? ""} onChange={(e) => setForm({ ...form, motorcycle_model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
              <F label="Matrícula"><input value={form.license_plate ?? ""} onChange={(e) => setForm({ ...form, license_plate: formatLicensePlate(e.target.value) })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
              <F label="Estado">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as WorkOrder["status"] })} className="w-full px-3 py-2 rounded-md border bg-background">
                  {Object.entries(WO_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </F>
            </div>
            <div className="mt-4">
              <F label="Observações / Diagnóstico da avaria">
                <textarea rows={4} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" />
              </F>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={save} className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
                Guardar Alterações
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Peças encomendadas para esta mota</h2>
              </div>
              <Link to="/parts/new" search={{ workOrderId: id }} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Encomendar peça
              </Link>
            </div>
            {parts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Ainda não há peças encomendadas para esta folha de obra.</div>
            ) : (
              <div className="divide-y">
                {parts.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link to="/parts/$id" params={{ id: p.id }} className="font-medium hover:underline block truncate">
                        {p.part_name || "Peça sem nome"}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.part_code && <span className="font-mono">{p.part_code} · </span>}
                        Qtd {p.quantity} · Custo {money(Number(p.cost_price))} · Venda {money(Number(p.selling_price))}
                      </div>
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
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden h-fit">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Orçamentos gerados</h2>
          </div>
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Nenhum orçamento gerado ainda.</div>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => (
                <Link key={inv.id} to="/invoices/$id" params={{ id: inv.id }} className="block p-4 hover:bg-muted/50">
                  <div className="font-mono text-xs text-primary">{inv.invoice_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(inv.created_at).toLocaleDateString("pt-PT")}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
