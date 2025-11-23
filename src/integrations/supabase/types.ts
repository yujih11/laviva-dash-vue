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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      crescimento_produtos: {
        Row: {
          codigo_produto: string
          percentual_crescimento: number | null
        }
        Insert: {
          codigo_produto: string
          percentual_crescimento?: number | null
        }
        Update: {
          codigo_produto?: string
          percentual_crescimento?: number | null
        }
        Relationships: []
      }
      estoque_atual: {
        Row: {
          codigo_produto: string
          created_at: string | null
          data_validade: string | null
          id: string
          lote: string | null
          marca: string | null
          produto: string
          quantidade_disponivel: number | null
          quantidade_total: number | null
        }
        Insert: {
          codigo_produto: string
          created_at?: string | null
          data_validade?: string | null
          id?: string
          lote?: string | null
          marca?: string | null
          produto: string
          quantidade_disponivel?: number | null
          quantidade_total?: number | null
        }
        Update: {
          codigo_produto?: string
          created_at?: string | null
          data_validade?: string | null
          id?: string
          lote?: string | null
          marca?: string | null
          produto?: string
          quantidade_disponivel?: number | null
          quantidade_total?: number | null
        }
        Relationships: []
      }
      historico: {
        Row: {
          ano: number
          categoria: string | null
          cliente: string
          codigo_produto: string
          created_at: string | null
          data_pedido: string
          id: string
          marca: string | null
          mes: number
          produto: string
          quantidade: number
        }
        Insert: {
          ano: number
          categoria?: string | null
          cliente: string
          codigo_produto: string
          created_at?: string | null
          data_pedido: string
          id?: string
          marca?: string | null
          mes: number
          produto: string
          quantidade: number
        }
        Update: {
          ano?: number
          categoria?: string | null
          cliente?: string
          codigo_produto?: string
          created_at?: string | null
          data_pedido?: string
          id?: string
          marca?: string | null
          mes?: number
          produto?: string
          quantidade?: number
        }
        Relationships: []
      }
      pedidos_entrada: {
        Row: {
          categoria: string | null
          cliente: string
          codigo_produto: string
          condicao_pagamento: string | null
          created_at: string | null
          data_pedido: string
          id: string
          marca: string | null
          origem: string | null
          preco_unitario: number | null
          produto: string
          quantidade: number
          representante: string | null
          valor_total: number | null
        }
        Insert: {
          categoria?: string | null
          cliente: string
          codigo_produto: string
          condicao_pagamento?: string | null
          created_at?: string | null
          data_pedido: string
          id?: string
          marca?: string | null
          origem?: string | null
          preco_unitario?: number | null
          produto: string
          quantidade: number
          representante?: string | null
          valor_total?: number | null
        }
        Update: {
          categoria?: string | null
          cliente?: string
          codigo_produto?: string
          condicao_pagamento?: string | null
          created_at?: string | null
          data_pedido?: string
          id?: string
          marca?: string | null
          origem?: string | null
          preco_unitario?: number | null
          produto?: string
          quantidade?: number
          representante?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      previsao_dashboard: {
        Row: {
          alertas: string[] | null
          categoria: string | null
          cliente: string | null
          codigo_produto: string | null
          comparativos: Json | null
          crescimento_manual: number | null
          data_atualizacao: string | null
          id: string
          previsao_2025: Json | null
          previsao_2026: Json | null
          produto: string | null
        }
        Insert: {
          alertas?: string[] | null
          categoria?: string | null
          cliente?: string | null
          codigo_produto?: string | null
          comparativos?: Json | null
          crescimento_manual?: number | null
          data_atualizacao?: string | null
          id?: string
          previsao_2025?: Json | null
          previsao_2026?: Json | null
          produto?: string | null
        }
        Update: {
          alertas?: string[] | null
          categoria?: string | null
          cliente?: string | null
          codigo_produto?: string | null
          comparativos?: Json | null
          crescimento_manual?: number | null
          data_atualizacao?: string | null
          id?: string
          previsao_2025?: Json | null
          previsao_2026?: Json | null
          produto?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      estoque_resumido: {
        Row: {
          codigo_produto: string | null
          estoque_disponivel: number | null
          estoque_total: number | null
          marca: string | null
          produto: string | null
        }
        Relationships: []
      }
      historico_resumido: {
        Row: {
          ano: number | null
          categoria: string | null
          cliente: string | null
          codigo_produto: string | null
          marca: string | null
          mes: number | null
          pedidos: number | null
          produto: string | null
          total_quantidade: number | null
          ultima_venda: string | null
        }
        Relationships: []
      }
      previsao_resumida_por_codigo: {
        Row: {
          ano: string | null
          codigo_produto: string | null
          mes: string | null
          previsao_por_cliente: Json | null
          produto: string | null
          total_previsto: number | null
        }
        Relationships: []
      }
      vendas_reais_com_ultima_venda: {
        Row: {
          ano: number | null
          codigo_produto: string | null
          mes: number | null
          produto: string | null
          quantidade_total: number | null
          ultima_venda: string | null
          vendas_por_cliente: Json | null
        }
        Relationships: []
      }
      vendas_reais_resumidas: {
        Row: {
          ano: number | null
          clientes: string[] | null
          codigo_produto: string | null
          mes: number | null
          produto: string | null
          total_vendido: number | null
        }
        Relationships: []
      }
      vendas_reais_resumidas_por_codigo: {
        Row: {
          ano: number | null
          codigo_produto: string | null
          mes: number | null
          produto: string | null
          total_vendido: number | null
          vendas_por_cliente: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      update_user_telegram_id: {
        Args: { telegram_user_id: number; user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
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
      app_role: ["admin", "viewer"],
    },
  },
} as const
