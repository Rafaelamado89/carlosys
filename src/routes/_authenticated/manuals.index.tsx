import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Manual } from "@/lib/workshop";
import { BookOpen, Download, ExternalLink, Link2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/manuals/")({
  head: () => ({
    meta: [
      { title: "Manuais · Workshop ERP" },
      { name: "description", content: "Biblioteca de manuais técnicos da oficina, pesquisável por modelo, marca ou peça." },
      { property: "og:title", content: "Manuais · Workshop ERP" },
      { property: "og:description", content: "Biblioteca de manuais técnicos da oficina, pesquisável por modelo, marca ou peça." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManualsPage,
});

const EMPTY = { title: "", brand: "", model: "", keywords: "", description: "", external_url: "" };

function ManualsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["manuals", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manuals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Manual[];
    },
  });

  const filtered = data.filter((m) => {
    if (!q.trim()) return true;
    const hay = [m.title, m.brand, m.model, m.keywords, m.description, m.file_name, m.external_url]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => hay.includes(term));
  });

  const submit = async () => {
    if (!form.title.trim() && !file && !form.external_url.trim()) {
      return toast.error("Adiciona pelo menos um título, um link ou um ficheiro.");
    }
    setSaving(true);
    try {
      let file_path: string | null = null;
      let file_name: string | null = null;
      if (file) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("manuals").upload(path, file);
        if (upErr) throw upErr;
        file_path = path;
        file_name = file.name;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("manuals").insert({
        title: form.title || file_name || form.external_url || "Manual",
        brand: form.brand || null,
        model: form.model || null,
        keywords: form.keywords || null,
        description: form.description || null,
        external_url: form.external_url || null,
        file_path,
        file_name,
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Manual adicionado");
      setForm(EMPTY);
      setFile(null);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["manuals", "list"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível guardar o manual.");
    } finally {
      setSaving(false);
    }
  };

  const openFile = async (m: Manual) => {
    if (!m.file_path) return;
    const { data, error } = await supabase.storage.from("manuals").createSignedUrl(m.file_path, 60 * 10, { download: m.file_name ?? true });
    if (error || !data) return toast.error("Não foi possível abrir o ficheiro.");
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (m: Manual) => {
    if (!confirm("Eliminar este manual?")) return;
    if (m.file_path) await supabase.storage.from("manuals").remove([m.file_path]);
    const { error } = await supabase.from("manuals").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["manuals", "list"] });
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manuais</h1>
          <p className="text-muted-foreground mt-1">Biblioteca de manuais e documentação técnica</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {open ? "Fechar" : "Adicionar manual"}
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          placeholder="Pesquisar por modelo, marca, peça, palavra-chave…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-3 py-3 rounded-md border bg-background text-base"
        />
      </div>

      {open && (
        <div className="bg-card border rounded-xl p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Título"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Marca"><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Modelo"><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
            <F label="Palavras-chave"><input placeholder="travões, corrente, 2019…" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          </div>
          <F label="Descrição"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Link do manual"><input type="url" placeholder="https://…" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="w-full px-3 py-2 rounded-md border bg-background" /></F>
          <F label="Ou carregar ficheiro (PDF, imagem, etc.)">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full px-3 py-2 rounded-md border bg-background text-sm" />
          </F>
          <div className="flex justify-end">
            <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
              <Upload className="h-4 w-4" /> {saving ? "A guardar…" : "Guardar manual"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhum manual encontrado.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((m) => (
              <div key={m.id} className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center shrink-0">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{m.title || m.file_name || "Manual"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[m.brand, m.model, m.keywords].filter(Boolean).join(" · ") || "Sem detalhes"}
                  </div>
                  {m.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{m.description}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.external_url && (
                    <a href={m.external_url} target="_blank" rel="noreferrer" title="Abrir link" className="p-2 rounded-md border hover:bg-muted">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {m.file_path && (
                    <button onClick={() => openFile(m)} title="Descarregar ficheiro" className="p-2 rounded-md border hover:bg-muted">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => remove(m)} title="Eliminar" className="p-2 rounded-md border text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5" /> Podes adicionar manuais por link ou carregando o ficheiro — ficam guardados e pesquisáveis por todos.
      </p>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium mb-1.5 block">{label}</label>{children}</div>;
}
