import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, type Invoice, type InvoiceItem } from "@/lib/workshop";
import { ArrowLeft, Plus, Printer, Trash2, Wrench, Save } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice · Workshop ERP" }] }),
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

  if (!draft) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const { invoice, items } = draft;
  const laborItems = items.filter((i) => i.item_type === "labor");
  const partItems = items.filter((i) => i.item_type === "part");
  const laborSubtotal = laborItems.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
  const partsSubtotal = partItems.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
  const subtotal = laborSubtotal + partsSubtotal;
  const vat = subtotal * (Number(invoice.vat_rate) / 100);
  const total = subtotal + vat;

  const setInv = (patch: Partial<Invoice>) => setDraft({ ...draft, invoice: { ...invoice, ...patch } });
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, items: next });
  };
  const addItem = (item_type: "labor" | "part") => {
    setDraft({
      ...draft,
      items: [
        ...items,
        {
          id: `new-${Date.now()}-${Math.random()}`,
          invoice_id: id,
          item_type,
          description: "",
          quantity: 1,
          unit_price: 0,
          position: items.length,
          _new: true,
        },
      ],
    });
  };
  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setDraft({ ...draft, items: next });
  };

  const save = async () => {
    const { error: uErr } = await supabase.from("invoices").update({
      client_name: invoice.client_name,
      client_address: invoice.client_address,
      client_tax_id: invoice.client_tax_id,
      motorcycle_info: invoice.motorcycle_info,
      vat_rate: invoice.vat_rate,
      notes: invoice.notes,
    }).eq("id", id);
    if (uErr) return toast.error(uErr.message);

    // Delete removed items
    const { data: existing } = await supabase.from("invoice_items").select("id").eq("invoice_id", id);
    const keepIds = new Set(items.filter((i) => !i._new).map((i) => i.id));
    const toDelete = (existing ?? []).map((e) => e.id).filter((eid) => !keepIds.has(eid));
    if (toDelete.length > 0) await supabase.from("invoice_items").delete().in("id", toDelete);

    // Upsert items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it._new) {
        await supabase.from("invoice_items").insert({
          invoice_id: id,
          item_type: it.item_type,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          position: i,
        });
      } else {
        await supabase.from("invoice_items").update({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          position: i,
        }).eq("id", it.id);
      }
    }
    toast.success("Invoice saved");
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices", "list"] });
  };

  const remove = async () => {
    if (!confirm("Delete this invoice?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    nav({ to: "/invoices" });
  };

  const doPrint = async () => {
    await save();
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="no-print">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> All invoices
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="font-mono text-sm text-primary font-semibold">{invoice.invoice_number}</div>
            <h1 className="text-3xl font-bold tracking-tight">{invoice.client_name || "Untitled invoice"}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border font-semibold hover:bg-muted">
              <Save className="h-4 w-4" /> Save
            </button>
            <button onClick={doPrint} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={remove} className="p-2 rounded-md border text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Edit fields */}
        <div className="bg-card border rounded-xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <F label="Client name"><input value={invoice.client_name} onChange={(e) => setInv({ client_name: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Tax ID / VAT"><input value={invoice.client_tax_id ?? ""} onChange={(e) => setInv({ client_tax_id: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Address"><input value={invoice.client_address ?? ""} onChange={(e) => setInv({ client_address: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Motorcycle"><input value={invoice.motorcycle_info ?? ""} onChange={(e) => setInv({ motorcycle_info: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="VAT rate (%)"><input type="number" step="0.01" value={invoice.vat_rate} onChange={(e) => setInv({ vat_rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Notes"><input value={invoice.notes ?? ""} onChange={(e) => setInv({ notes: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
        </div>

        {/* Editable items */}
        <div className="space-y-6 mb-6">
          <ItemsEditor title="Labor" items={items} type="labor" onAdd={() => addItem("labor")} onUpdate={updateItem} onRemove={removeItem} />
          <ItemsEditor title="Parts" items={items} type="part" onAdd={() => addItem("part")} onUpdate={updateItem} onRemove={removeItem} />
        </div>
      </div>

      {/* Printable area */}
      <div className="print-area bg-card border rounded-xl p-8 lg:p-10 shadow-sm">
        <header className="flex items-start justify-between gap-6 mb-8 pb-6 border-b">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary grid place-items-center">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-xl font-bold">Workshop</div>
            </div>
            <div className="text-sm text-muted-foreground">Motorcycle service & repair</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Invoice</div>
            <div className="font-mono text-lg font-bold text-primary">{invoice.invoice_number}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {new Date(invoice.created_at).toLocaleDateString()}
            </div>
          </div>
        </header>

        <section className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Bill to</div>
            <div className="font-semibold">{invoice.client_name}</div>
            {invoice.client_address && <div className="text-sm">{invoice.client_address}</div>}
            {invoice.client_tax_id && <div className="text-sm text-muted-foreground">Tax ID: {invoice.client_tax_id}</div>}
          </div>
          {invoice.motorcycle_info && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Vehicle</div>
              <div className="font-medium">{invoice.motorcycle_info}</div>
            </div>
          )}
        </section>

        <PrintSection title="Labor" items={laborItems} subtotal={laborSubtotal} />
        <PrintSection title="Parts" items={partItems} subtotal={partsSubtotal} />

        <div className="flex justify-end mt-8">
          <div className="w-full sm:w-80 space-y-2 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label={`VAT (${Number(invoice.vat_rate).toFixed(2)}%)`} value={money(vat)} />
            <div className="border-t pt-2 mt-2">
              <Row label="Total" value={money(total)} bold />
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t text-sm">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notes</div>
            <div>{invoice.notes}</div>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t text-xs text-muted-foreground text-center">
          Thank you for your business.
        </footer>
      </div>
    </div>
  );
}

function ItemsEditor({
  title, items, type, onAdd, onUpdate, onRemove,
}: {
  title: string;
  items: (InvoiceItem & { _new?: boolean })[];
  type: "labor" | "part";
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<InvoiceItem>) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Add line
        </button>
      </div>
      <div className="divide-y">
        {items.map((it, idx) => {
          if (it.item_type !== type) return null;
          return (
            <div key={it.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_5rem_7rem_auto] gap-2 p-3 items-center">
              <input
                placeholder={type === "labor" ? "Labor description…" : "Part description…"}
                value={it.description}
                onChange={(e) => onUpdate(idx, { description: e.target.value })}
                className="px-3 py-2 rounded-md border bg-background"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Qty"
                value={it.quantity}
                onChange={(e) => onUpdate(idx, { quantity: parseFloat(e.target.value) || 0 })}
                className="hidden sm:block px-2 py-2 rounded-md border bg-background text-right"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Unit €"
                value={it.unit_price}
                onChange={(e) => onUpdate(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                className="hidden sm:block px-2 py-2 rounded-md border bg-background text-right"
              />
              <button onClick={() => onRemove(idx)} className="p-2 rounded-md text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="sm:hidden col-span-2 flex gap-2">
                <input type="number" step="0.01" placeholder="Qty" value={it.quantity} onChange={(e) => onUpdate(idx, { quantity: parseFloat(e.target.value) || 0 })} className="flex-1 px-2 py-2 rounded-md border bg-background text-right" />
                <input type="number" step="0.01" placeholder="Unit €" value={it.unit_price} onChange={(e) => onUpdate(idx, { unit_price: parseFloat(e.target.value) || 0 })} className="flex-1 px-2 py-2 rounded-md border bg-background text-right" />
              </div>
            </div>
          );
        })}
        {items.filter((i) => i.item_type === type).length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No {title.toLowerCase()} lines.</div>
        )}
      </div>
    </div>
  );
}

function PrintSection({ title, items, subtotal }: { title: string; items: InvoiceItem[]; subtotal: number }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-2 font-semibold">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="py-2">Description</th>
            <th className="py-2 text-right w-16">Qty</th>
            <th className="py-2 text-right w-24">Unit</th>
            <th className="py-2 text-right w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{it.description}</td>
              <td className="py-2 text-right font-mono">{Number(it.quantity)}</td>
              <td className="py-2 text-right font-mono">{money(Number(it.unit_price))}</td>
              <td className="py-2 text-right font-mono">{money(Number(it.quantity) * Number(it.unit_price))}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="py-2 text-right text-xs uppercase text-muted-foreground">{title} subtotal</td>
            <td className="py-2 text-right font-mono font-semibold">{money(subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-lg font-bold" : ""}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium mb-1.5 block">{label}</label>{children}</div>;
}
