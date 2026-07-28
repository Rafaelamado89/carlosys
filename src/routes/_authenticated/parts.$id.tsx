import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PART_STATUS_LABEL, money, type PartRequest, type WorkOrder } from "@/lib/workshop";
import { ArrowLeft, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchLinkPreview } from "@/lib/link-preview.functions";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";

export const Route = createFileRoute("/_authenticated/parts/$id")({
  head: () => ({ meta: [{ title: "Part · Workshop ERP" }] }),
  component: PartDetail,
});

function PartDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["part", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("parts_requests").select("*").eq("id", id).single();
      if (error) throw error;
      return data as PartRequest;
    },
  });

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

  const [form, setForm] = useState<PartRequest | null>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);

  if (!form) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const save = async () => {
    const { error } = await supabase
      .from("parts_requests")
      .update({
        work_order_id: form.work_order_id || null,
        part_name: form.part_name,
        part_code: form.part_code,
        motorcycle_model: form.motorcycle_model,
        external_url: form.external_url,
        cost_price: form.cost_price,
        selling_price: form.selling_price,
        quantity: form.quantity,
        status: form.status,
        notes: form.notes,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["part", id] });
    qc.invalidateQueries({ queryKey: ["parts_requests", "list"] });
  };

  const remove = async () => {
    if (!confirm("Delete this part?")) return;
    const { error } = await supabase.from("parts_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    nav({ to: "/parts" });
  };

  const margin = (Number(form.selling_price) - Number(form.cost_price)) * Number(form.quantity);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/parts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All parts
      </Link>

      <div className="flex items-start justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{form.part_name || "Peça sem nome"}</h1>
        <div className="flex gap-2 shrink-0">
          {form.external_url && (
            <a href={form.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
              <ExternalLink className="h-4 w-4" /> Open supplier
            </a>
          )}
          <button onClick={remove} className="p-2 rounded-md border text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Part name"><input value={form.part_name ?? ""} onChange={(e) => setForm({ ...form, part_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Part code"><input value={form.part_code ?? ""} onChange={(e) => setForm({ ...form, part_code: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
          <F label="Motorcycle model"><input value={form.motorcycle_model ?? ""} onChange={(e) => setForm({ ...form, motorcycle_model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Quantity"><input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Cost price (€)"><input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Selling price (€)"><input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PartRequest["status"] })} className="w-full px-3 py-2 rounded-md border bg-background">
              {Object.entries(PART_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <F label="Linked work order">
            <select value={form.work_order_id ?? ""} onChange={(e) => setForm({ ...form, work_order_id: e.target.value || null })} className="w-full px-3 py-2 rounded-md border bg-background">
              <option value="">— None —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.client_name || "Sem cliente"} — {[o.motorcycle_make, o.motorcycle_model].filter(Boolean).join(" ") || "Mota"}</option>
              ))}
            </select>
          </F>
        </div>
        <F label="External URL"><input type="url" value={form.external_url ?? ""} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        <F label="Notes"><textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Margin: </span>
            <span className={`font-mono font-semibold ${margin >= 0 ? "text-success" : "text-destructive"}`}>{money(margin)}</span>
          </div>
          <button onClick={save} className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium mb-1.5 block">{label}</label>{children}</div>;
}
