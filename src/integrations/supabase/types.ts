export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount: number
          id: string
          invoice_id: string
          item_type: Database["public"]["Enums"]["invoice_item_type"]
          position: number
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount?: number
          id?: string
          invoice_id: string
          item_type: Database["public"]["Enums"]["invoice_item_type"]
          position?: number
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount?: number
          id?: string
          invoice_id?: string
          item_type?: Database["public"]["Enums"]["invoice_item_type"]
          position?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_tax_id: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_number: string
          moto_brand: string | null
          moto_kms: number | null
          moto_model: string | null
          moto_plate: string | null
          moto_vin: string | null
          motorcycle_info: string | null
          notes: string | null
          obs: string | null
          retention: boolean
          updated_at: string
          vat_rate: number
          work_order_id: string | null
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_tax_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: string
          moto_brand?: string | null
          moto_kms?: number | null
          moto_model?: string | null
          moto_plate?: string | null
          moto_vin?: string | null
          motorcycle_info?: string | null
          notes?: string | null
          obs?: string | null
          retention?: boolean
          updated_at?: string
          vat_rate?: number
          work_order_id?: string | null
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_tax_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: string
          moto_brand?: string | null
          moto_kms?: number | null
          moto_model?: string | null
          moto_plate?: string | null
          moto_vin?: string | null
          motorcycle_info?: string | null
          notes?: string | null
          obs?: string | null
          retention?: boolean
          updated_at?: string
          vat_rate?: number
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_requests: {
        Row: {
          cost_price: number
          created_at: string
          created_by: string | null
          external_url: string | null
          id: string
          motorcycle_model: string | null
          notes: string | null
          part_code: string | null
          part_name: string
          quantity: number
          selling_price: number
          status: Database["public"]["Enums"]["part_order_status"]
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          cost_price?: number
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          motorcycle_model?: string | null
          notes?: string | null
          part_code?: string | null
          part_name: string
          quantity?: number
          selling_price?: number
          status?: Database["public"]["Enums"]["part_order_status"]
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          cost_price?: number
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          motorcycle_model?: string | null
          notes?: string | null
          part_code?: string | null
          part_name?: string
          quantity?: number
          selling_price?: number
          status?: Database["public"]["Enums"]["part_order_status"]
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_requests_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          license_plate: string | null
          motorcycle_make: string
          motorcycle_model: string
          notes: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          updated_at: string
        }
        Insert: {
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          license_plate?: string | null
          motorcycle_make: string
          motorcycle_model: string
          notes?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
        }
        Update: {
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          license_plate?: string | null
          motorcycle_make?: string
          motorcycle_model?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
      invoice_item_type: "labor" | "part"
      part_order_status:
        | "pending"
        | "ordered"
        | "shipped"
        | "received"
        | "cancelled"
      work_order_status:
        | "open"
        | "in_progress"
        | "waiting_parts"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      invoice_item_type: ["labor", "part"],
      part_order_status: [
        "pending",
        "ordered",
        "shipped",
        "received",
        "cancelled",
      ],
      work_order_status: [
        "open",
        "in_progress",
        "waiting_parts",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
