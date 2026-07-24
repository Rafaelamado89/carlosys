import type { Database } from "@/integrations/supabase/types";

export type WorkOrder = {
  id: string;
  client_name: string;
  client_phone: string | null;
  motorcycle_make: string;
  motorcycle_model: string;
  license_plate: string | null;
  status: "open" | "in_progress" | "waiting_parts" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PartRequest = {
  id: string;
  work_order_id: string | null;
  part_name: string;
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
  client_name: string;
  client_address: string | null;
  client_tax_id: string | null;
  motorcycle_info: string | null;
  vat_rate: number;
  notes: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  position: number;
};

export const WO_STATUS_LABEL: Record<WorkOrder["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_parts: "Waiting parts",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PART_STATUS_LABEL: Record<PartRequest["status"], string> = {
  pending: "Pending",
  ordered: "Ordered",
  shipped: "Shipped",
  received: "Received",
  cancelled: "Cancelled",
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

// Suppress unused import warning for types file consumers
export type _DbRef = Database;
