import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, formatLicensePlate, type Invoice, type InvoiceItem } from "@/lib/workshop";
import { ArrowLeft, Plus, Printer, Trash2, Save, Eye, Package } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({ meta: [{ title: "Orçamento · Workshop ERP" }] }),
  component: InvoiceDetail,
});

type Draft = {
  invoice: Invoice;
  items: (InvoiceItem & { _new?: boolean })[];
};

function InvoiceDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const { data } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase.from("invoices").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: items, error: iErr } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("position", { ascending: true });
      if (iErr) throw iErr;
      return { invoice: inv as Invoice, items: items as InvoiceItem[] };
    },
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => { if (data) setDraft(data as Draft); }, [data]);

  if (!draft) return <div className="p-8 text-muted-foreground">A carregar…</div>;

  const { invoice, items } = draft;

  const lineNet = (it: InvoiceItem) => {
    const gross = Number(it.quantity) * Number(it.unit_price);
    return gross - gross * Number(it.discount || 0);
  };
  const subtotal = items.reduce((s, it) => s + lineNet(it), 0);
  const grossTotal = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
  const discountTotal = grossTotal - subtotal;
  const vat = subtotal * (Number(invoice.vat_rate) / 100);
  const retention = invoice.retention ? vat * 0.5 : 0;
  const total = subtotal + vat - retention;

  const setInv = (patch: Partial<Invoice>) => setDraft({ ...draft, invoice: { ...invoice, ...patch } });
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, items: next });
  };
  const addItem = () => {
    setDraft({
      ...draft,
      items: [
        ...items,
        {
          id: `new-${Date.now()}-${Math.random()}`,
          invoice_id: id,
          item_type: "part",
          description: "",
          quantity: 1,
          unit_price: 0,
          discount: 0,
          position: items.length,
          _new: true,
        },
      ],
    });
  };

  const importWorkOrderParts = async () => {
    if (!invoice.work_order_id) return toast.error("Sem folha de obra associada a este orçamento.");
    const { data: partsList, error } = await supabase
      .from("parts_requests")
      .select("*")
      .eq("work_order_id", invoice.work_order_id)
      .neq("status", "cancelled");
    if (error) return toast.error(error.message);
    if (!partsList || partsList.length === 0) {
      return toast.info("Nenhuma peça encomendada encontrada na folha de obra.");
    }
    const newItems = partsList.map((p, idx) => ({
      id: `new-${Date.now()}-${Math.random()}`,
      invoice_id: id,
      item_type: "part" as const,
      description: p.part_name ?? "",
      quantity: p.quantity || 1,
      unit_price: Number(p.selling_price) || 0,
      discount: 0,
      position: items.length + idx,
      _new: true,
    }));
    setDraft({ ...draft, items: [...items, ...newItems] });
    toast.success(`${newItems.length} peça(s) importada(s) da folha de obra`);
  };

  const removeItem = (idx: number) => {
    setDraft({ ...draft, items: items.filter((_, i) => i !== idx) });
  };

  const save = async (silent = false) => {
    const { error: uErr } = await supabase.from("invoices").update({
      client_name: invoice.client_name,
      client_phone: invoice.client_phone,
      client_email: invoice.client_email,
      client_address: invoice.client_address,
      client_tax_id: invoice.client_tax_id,
      obs: invoice.obs,
      moto_brand: invoice.moto_brand,
      moto_model: invoice.moto_model,
      moto_plate: invoice.moto_plate,
      moto_kms: invoice.moto_kms,
      moto_vin: invoice.moto_vin,
      vat_rate: invoice.vat_rate,
      retention: invoice.retention,
      notes: invoice.notes,
    }).eq("id", id);
    if (uErr) return toast.error(uErr.message);

    const { data: existing } = await supabase.from("invoice_items").select("id").eq("invoice_id", id);
    const keepIds = new Set(items.filter((i) => !i._new).map((i) => i.id));
    const toDelete = (existing ?? []).map((e) => e.id).filter((eid) => !keepIds.has(eid));
    if (toDelete.length > 0) await supabase.from("invoice_items").delete().in("id", toDelete);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const payload = {
        item_type: it.item_type,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount: it.discount || 0,
        position: i,
      };
      if (it._new) {
        await supabase.from("invoice_items").insert({ invoice_id: id, ...payload });
      } else {
        await supabase.from("invoice_items").update(payload).eq("id", it.id);
      }
    }
    if (!silent) toast.success("Orçamento guardado");
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices", "list"] });
  };

  const remove = async () => {
    if (!confirm("Eliminar este orçamento?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    nav({ to: "/invoices" });
  };

  const doPrint = async () => {
    await save(true);
    setShowPreview(true);
    toast.dismiss();
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="no-print">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Todos os orçamentos
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="font-mono text-sm text-primary font-semibold">Nº {invoice.invoice_number}</div>
            <h1 className="text-3xl font-bold tracking-tight">{invoice.client_name || "Sem cliente"}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => save()} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border font-semibold hover:bg-muted">
              <Save className="h-4 w-4" /> Guardar
            </button>
            <button onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border font-semibold hover:bg-muted">
              <Eye className="h-4 w-4" /> {showPreview ? "Ocultar" : "Pré-visualizar"}
            </button>
            <button onClick={doPrint} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
              <Printer className="h-4 w-4" /> Imprimir
            </button>
            <button onClick={remove} className="p-2 rounded-md border text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cliente / Moto */}
        <div className="bg-card border rounded-xl p-6 mb-6 grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Cliente</div>
            <F label="Nome"><input value={invoice.client_name ?? ""} onChange={(e) => setInv({ client_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="NIF"><input value={invoice.client_tax_id ?? ""} onChange={(e) => setInv({ client_tax_id: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Telefone"><input value={invoice.client_phone ?? ""} onChange={(e) => setInv({ client_phone: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Email"><input value={invoice.client_email ?? ""} onChange={(e) => setInv({ client_email: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="OBS"><input value={invoice.obs ?? ""} onChange={(e) => setInv({ obs: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          </div>
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Motociclo</div>
            <F label="Marca"><input value={invoice.moto_brand ?? ""} onChange={(e) => setInv({ moto_brand: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Modelo"><input value={invoice.moto_model ?? ""} onChange={(e) => setInv({ moto_model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Matrícula"><input value={invoice.moto_plate ?? ""} onChange={(e) => setInv({ moto_plate: formatLicensePlate(e.target.value) })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
            <F label="Kms"><input type="number" value={invoice.moto_kms ?? ""} onChange={(e) => setInv({ moto_kms: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="VIN"><input value={invoice.moto_vin ?? ""} onChange={(e) => setInv({ moto_vin: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background font-mono" /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="IVA (%)"><input type="number" step="0.01" value={invoice.vat_rate} onChange={(e) => setInv({ vat_rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
              <F label="Retenção">
                <label className="inline-flex items-center gap-2 h-10">
                  <input type="checkbox" checked={invoice.retention} onChange={(e) => setInv({ retention: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm">Aplicar</span>
                </label>
              </F>
            </div>
          </div>
        </div>

        {/* Linhas */}
        <div className="bg-card border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Linhas do orçamento</h3>
            <div className="flex items-center gap-3">
              {invoice.work_order_id && (
                <button onClick={importWorkOrderParts} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Package className="h-3.5 w-3.5" /> Importar peças da folha de obra
                </button>
              )}
              <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Adicionar linha
              </button>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-[5rem_minmax(0,1fr)_6rem_7rem_5rem_7rem_2.5rem] gap-2 px-3 py-2 text-xs uppercase text-muted-foreground border-b">
            <div>Qtde</div>
            <div>Descrição</div>
            <div className="text-right">Preço un.</div>
            <div className="text-right">Total</div>
            <div className="text-right">Desc.</div>
            <div className="text-right">Total líq.</div>
            <div></div>
          </div>
          <div className="divide-y">
            {items.map((it, idx) => {
              const gross = Number(it.quantity) * Number(it.unit_price);
              const net = gross - gross * Number(it.discount || 0);
              return (
                <div key={it.id} className="grid grid-cols-2 md:grid-cols-[5rem_minmax(0,1fr)_6rem_7rem_5rem_7rem_2.5rem] gap-2 p-3 items-center">
                  <input type="number" step="1" min="0" placeholder="Qtde" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} className="px-2 py-2 rounded-md border bg-background text-right" />
                  <input placeholder="Descrição" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className="col-span-2 md:col-span-1 px-3 py-2 rounded-md border bg-background" />
                  <input type="number" step="0.01" placeholder="Preço un." value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })} className="px-2 py-2 rounded-md border bg-background text-right" />
                  <div className="text-right font-mono text-sm text-muted-foreground">{money(gross)}</div>
                  <input type="number" step="1" min="0" max="100" placeholder="% desc." value={Math.round((Number(it.discount) || 0) * 100)} onChange={(e) => updateItem(idx, { discount: (parseFloat(e.target.value) || 0) / 100 })} className="px-2 py-2 rounded-md border bg-background text-right" />
                  <div className="text-right font-mono text-sm font-semibold">{money(net)}</div>
                  <button onClick={() => removeItem(idx)} className="p-2 rounded-md text-destructive hover:bg-destructive/10 justify-self-end">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Sem linhas. Clique em “Adicionar linha”.</div>}
          </div>
        </div>

        <F label="Notas"><textarea rows={2} value={invoice.notes ?? ""} onChange={(e) => setInv({ notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
      </div>

      {/* Preview / print */}
      {(showPreview || typeof window !== "undefined") && (
        <div className={showPreview ? "mt-8" : "hidden print:block"}>
          <div className="print-area orcamento-print bg-white text-black border rounded-xl p-8 lg:p-10 shadow-sm">
            <header className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-[0.3em]">ORÇAMENTO</h2>
            </header>

            <div className="flex justify-end mb-4 text-sm">
              <table className="border-collapse">
                <tbody>
                  <tr><td className="pr-2 font-semibold">Data:</td><td className="border-b border-black min-w-[8rem]">{new Date(invoice.created_at).toLocaleDateString("pt-PT")}</td></tr>
                  <tr><td className="pr-2 font-semibold">Nº</td><td className="border-b border-black">{invoice.invoice_number}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
              <table className="w-full">
                <tbody>
                  <InfoRow label="Nome:" value={invoice.client_name} />
                  <InfoRow label="Telefone:" value={invoice.client_phone} />
                  <InfoRow label="Email:" value={invoice.client_email} />
                  <InfoRow label="NIF:" value={invoice.client_tax_id} />
                  <InfoRow label="OBS:" value={invoice.obs} />
                </tbody>
              </table>
              <table className="w-full">
                <tbody>
                  <InfoRow label="Marca:" value={invoice.moto_brand} />
                  <InfoRow label="Modelo:" value={invoice.moto_model} />
                  <InfoRow label="Matrícula:" value={invoice.moto_plate} mono />
                  <InfoRow label="Kms:" value={invoice.moto_kms != null ? String(invoice.moto_kms) : null} />
                  <InfoRow label="VIN:" value={invoice.moto_vin} mono />
                </tbody>
              </table>
            </div>

            <table className="w-full text-sm border-collapse border border-black mb-6">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-black px-2 py-1.5 w-16">QTDE</th>
                  <th className="border border-black px-2 py-1.5 text-left">DESCRIÇÃO</th>
                  <th className="border border-black px-2 py-1.5 w-24">PREÇO UN.</th>
                  <th className="border border-black px-2 py-1.5 w-24">TOTAL</th>
                  <th className="border border-black px-2 py-1.5 w-16">DESC.</th>
                  <th className="border border-black px-2 py-1.5 w-28">TOTAL LÍQUIDO</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const gross = Number(it.quantity) * Number(it.unit_price);
                  const net = gross - gross * Number(it.discount || 0);
                  return (
                    <tr key={it.id}>
                      <td className="border border-black px-2 py-1 text-center font-mono">{Number(it.quantity) || ""}</td>
                      <td className="border border-black px-2 py-1">{it.description}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{it.unit_price ? money(Number(it.unit_price)) : ""}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{gross ? money(gross) : ""}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{it.discount ? `${(Number(it.discount) * 100).toFixed(0)}%` : ""}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{net ? money(net) : ""}</td>
                    </tr>
                  );
                })}
                {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-black px-2 py-1">&nbsp;</td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <table className="text-sm border-collapse">
                <tbody>
                  <TotalRow label="SUB-TOTAL" value={money(subtotal)} />
                  <TotalRow label="DESCONTO" value={money(discountTotal)} />
                  <TotalRow label={`IVA (${Number(invoice.vat_rate).toFixed(0)}%)`} value={money(vat)} />
                  {invoice.retention && <TotalRow label="RETENÇÃO-FONTE" value={`- ${money(retention)}`} />}
                  <tr className="font-bold text-base">
                    <td className="border border-black px-3 py-1.5 bg-neutral-100">TOTAL</td>
                    <td className="border border-black px-3 py-1.5 text-right font-mono bg-neutral-100">{money(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-4 border-t text-sm">
                <div className="font-semibold mb-1">Notas</div>
                <div className="whitespace-pre-wrap">{invoice.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <tr>
      <td className="pr-2 py-0.5 font-semibold align-top w-24">{label}</td>
      <td className={`py-0.5 border-b border-black ${mono ? "font-mono" : ""}`}>{value || "\u00A0"}</td>
    </tr>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="border border-black px-3 py-1 font-semibold">{label}</td>
      <td className="border border-black px-3 py-1 text-right font-mono min-w-[8rem]">{value}</td>
    </tr>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium mb-1.5 block">{label}</label>{children}</div>;
}
