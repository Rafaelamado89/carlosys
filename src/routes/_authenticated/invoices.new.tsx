import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({ meta: [{ title: "Novo orçamento · Workshop ERP" }] }),
  component: NewInvoice,
});

function NewInvoice() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    client_address: "",
    client_tax_id: "",
    obs: "",
    moto_brand: "",
    moto_model: "",
    moto_plate: "",
    moto_kms: "",
    moto_vin: "",
    vat_rate: 23,
    retention: false,
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("invoices").insert({
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      client_address: form.client_address || null,
      client_tax_id: form.client_tax_id || null,
      obs: form.obs || null,
      moto_brand: form.moto_brand || null,
      moto_model: form.moto_model || null,
      moto_plate: form.moto_plate || null,
      moto_kms: form.moto_kms ? Number(form.moto_kms) : null,
      moto_vin: form.moto_vin || null,
      motorcycle_info: [form.moto_brand, form.moto_model, form.moto_plate].filter(Boolean).join(" ") || null,
      vat_rate: form.vat_rate,
      retention: form.retention,
      notes: form.notes || null,
      created_by: user.user?.id,
    }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Orçamento criado");
    nav({ to: "/invoices/$id", params: { id: data!.id } });
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Novo orçamento</h1>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 space-y-5">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Cliente</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Nome" required><input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="NIF"><input value={form.client_tax_id} onChange={(e) => setForm({ ...form, client_tax_id: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Telefone"><input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Email"><input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Morada"><input value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Observações"><input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Motociclo</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Marca"><input value={form.moto_brand} onChange={(e) => setForm({ ...form, moto_brand: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Modelo"><input value={form.moto_model} onChange={(e) => setForm({ ...form, moto_model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Matrícula"><input value={form.moto_plate} onChange={(e) => setForm({ ...form, moto_plate: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
            <F label="Kms"><input type="number" value={form.moto_kms} onChange={(e) => setForm({ ...form, moto_kms: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="VIN"><input value={form.moto_vin} onChange={(e) => setForm({ ...form, moto_vin: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <F label="IVA (%)"><input type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Retenção na fonte">
            <label className="inline-flex items-center gap-2 h-10">
              <input type="checkbox" checked={form.retention} onChange={(e) => setForm({ ...form, retention: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm">Aplicar retenção (11.5% do IVA)</span>
            </label>
          </F>
        </div>

        <F label="Notas"><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        <button disabled={busy} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
          {busy ? "A criar…" : "Criar e adicionar linhas"}
        </button>
      </form>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium mb-1.5 block">{label}{required && <span className="text-destructive"> *</span>}</label>{children}</div>;
}
