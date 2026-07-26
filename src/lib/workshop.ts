import type { Database } from "@/integrations/supabase/types";

export type WorkOrder = {
  id: string;
  client_name: string | null;
  client_phone: string | null;
  motorcycle_make: string | null;
  motorcycle_model: string | null;
  license_plate: string | null;
  status: "open" | "in_progress" | "waiting_parts" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PartRequest = {
  id: string;
  work_order_id: string | null;
  part_name: string | null;
  part_code: string | null;
  motorcycle_model: string | null;
  external_url: string | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  status: "pending" | "ordered" | "shipped" | "received" | "cancelled";
  notes: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  work_order_id: string | null;
  client_name: string | null;
  client_address: string | null;
  client_tax_id: string | null;
  client_phone: string | null;
  client_email: string | null;
  obs: string | null;
  motorcycle_info: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  moto_plate: string | null;
  moto_kms: number | null;
  moto_vin: string | null;
  vat_rate: number;
  retention: boolean;
  notes: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_type: "labor" | "part";
  description: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  position: number;
};

export const WO_STATUS_LABEL: Record<WorkOrder["status"], string> = {
  open: "Aberta",
  in_progress: "Em Reparação",
  waiting_parts: "A Aguardar Peças",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const PART_STATUS_LABEL: Record<PartRequest["status"], string> = {
  pending: "Pendente",
  ordered: "Encomendada",
  shipped: "A Caminho",
  received: "Na Oficina",
  cancelled: "Cancelada",
};

export const WO_STATUS_CLASS: Record<WorkOrder["status"], string> = {
  open: "bg-muted text-foreground",
  in_progress: "bg-primary/20 text-primary border border-primary/30",
  waiting_parts: "bg-warning/20 text-warning border border-warning/30",
  completed: "bg-success/20 text-success border border-success/30",
  cancelled: "bg-destructive/20 text-destructive border border-destructive/30",
};

export const PART_STATUS_CLASS: Record<PartRequest["status"], string> = {
  pending: "bg-muted text-foreground",
  ordered: "bg-primary/20 text-primary border border-primary/30",
  shipped: "bg-warning/20 text-warning border border-warning/30",
  received: "bg-success/20 text-success border border-success/30",
  cancelled: "bg-destructive/20 text-destructive border border-destructive/30",
};

export const money = (n: number, currency = "EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n || 0);

export function formatLicensePlate(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return cleaned.match(/.{1,2}/g)?.join("-") ?? "";
}

// Suppress unused import warning for types file consumers
export type _DbRef = Database;
