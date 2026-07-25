import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { WO_STATUS_LABEL, formatLicensePlate } from "@/lib/workshop";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/work-orders/new")({
  head: () => ({ meta: [{ title: "Nova folha de obra · Workshop ERP" }] }),
  component: NewWorkOrder,
});

function NewWorkOrder() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    motorcycle_make: "",
    motorcycle_model: "",
    license_plate: "",
    status: "open" as keyof typeof WO_STATUS_LABEL,
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("work_orders")
      .insert({ ...form, created_by: user.user?.id })
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Folha de obra criada com sucesso");
    nav({ to: "/work-orders/$id", params: { id: data!.id } });
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/work-orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Nova Folha de Obra</h1>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome do cliente" required value={form.client_name} onChange={(v) => setForm({ ...form, client_name: v })} />
          <Field label="Telefone" value={form.client_phone} onChange={(v) => setForm({ ...form, client_phone: v })} />
          <Field label="Marca da mota" required value={form.motorcycle_make} onChange={(v) => setForm({ ...form, motorcycle_make: v })} />
          <Field label="Modelo da mota" required value={form.motorcycle_model} onChange={(v) => setForm({ ...form, motorcycle_model: v })} />
          <Field label="Matrícula" value={form.license_plate} onChange={(v) => setForm({ ...form, license_plate: formatLicensePlate(v) })} />
          <div>
            <label className="text-sm font-medium mb-1.5 block">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as keyof typeof WO_STATUS_LABEL })}
              className="w-full px-3 py-2 rounded-md border bg-background"
            >
              {Object.entries(WO_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Observações / Diagnóstico da avaria</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 rounded-md border bg-background"
          />
        </div>
        <div className="flex gap-3">
          <button disabled={busy} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? "A guardar…" : "Criar Folha de Obra"}
          </button>
          <Link to="/work-orders" className="px-5 py-2.5 rounded-md border font-medium hover:bg-muted">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md border bg-background"
      />
    </div>
  );
}
