import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({ meta: [{ title: "New invoice · Workshop ERP" }] }),
  component: NewInvoice,
});

function NewInvoice() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_address: "",
    client_tax_id: "",
    motorcycle_info: "",
    vat_rate: 22,
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("invoices").insert({
      ...form,
      client_address: form.client_address || null,
      client_tax_id: form.client_tax_id || null,
      motorcycle_info: form.motorcycle_info || null,
      notes: form.notes || null,
      created_by: user.user?.id,
    }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Invoice created");
    nav({ to: "/invoices/$id", params: { id: data!.id } });
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-6">New invoice</h1>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Client name" required><input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Tax ID / VAT"><input value={form.client_tax_id} onChange={(e) => setForm({ ...form, client_tax_id: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        </div>
        <F label="Address"><input value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Motorcycle (make/model/plate)"><input value={form.motorcycle_info} onChange={(e) => setForm({ ...form, motorcycle_info: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="VAT rate (%)"><input type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        </div>
        <F label="Notes"><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        <button disabled={busy} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
          {busy ? "Creating…" : "Create & add items"}
        </button>
      </form>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium mb-1.5 block">{label}{required && <span className="text-destructive"> *</span>}</label>{children}</div>;
}
