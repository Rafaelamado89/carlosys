import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PART_STATUS_LABEL, type WorkOrder } from "@/lib/workshop";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ workOrderId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/parts/new")({
  head: () => ({ meta: [{ title: "New part · Workshop ERP" }] }),
  validateSearch: searchSchema,
  component: NewPart,
});

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
    toast.success("Part added");
    nav({ to: "/parts/$id", params: { id: data!.id } });
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/parts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-6">New part request</h1>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Part name" required><input required value={form.part_name} onChange={(e) => setForm({ ...form, part_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Part code / OEM"><input value={form.part_code} onChange={(e) => setForm({ ...form, part_code: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
          <F label="Motorcycle model"><input value={form.motorcycle_model} onChange={(e) => setForm({ ...form, motorcycle_model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Quantity"><input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Cost price (€)"><input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Selling price (€)"><input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as keyof typeof PART_STATUS_LABEL })} className="w-full px-3 py-2 rounded-md border bg-background">
              {Object.entries(PART_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <F label="Linked work order">
            <select value={form.work_order_id} onChange={(e) => setForm({ ...form, work_order_id: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background">
              <option value="">— None —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.client_name} — {o.motorcycle_make} {o.motorcycle_model}</option>
              ))}
            </select>
          </F>
        </div>
        <F label="External URL (eBay, supplier…)">
          <input type="url" placeholder="https://…" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" />
        </F>
        <F label="Notes"><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        <div className="flex gap-3">
          <button disabled={busy} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? "Saving…" : "Create part"}
          </button>
          <Link to="/parts" className="px-5 py-2.5 rounded-md border font-medium hover:bg-muted">Cancel</Link>
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
