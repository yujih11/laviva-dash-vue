import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Tipos para os dados parseados de JSON
export interface PrevisaoMensal {
  mes: number;
  quantidade: number;
  valor?: number;
}

export interface Comparativo {
  periodo: string;
  variacao: number;
  tipo?: string;
}

export interface DashboardData extends Omit<Tables<"previsao_dashboard">, "previsao_2025" | "previsao_2026" | "comparativos"> {
  previsao_2025_parsed: PrevisaoMensal[] | null;
  previsao_2026_parsed: PrevisaoMensal[] | null;
  comparativos_parsed: Comparativo[] | null;
}

export interface EstoqueAtual extends Tables<"estoque_atual"> {}

export interface EstoqueResumido {
  codigo_produto: string | null;
  produto: string | null;
  marca: string | null;
  estoque_total: number | null;
  estoque_disponivel: number | null;
}

// Função helper para parse seguro de JSON
function safeJsonParse<T>(data: any): T | null {
  if (!data) return null;
  if (typeof data === "object") return data as T;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function useSupabaseDashboardData() {
  // Query para previsao_dashboard
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["previsao_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("previsao_dashboard")
        .select("*")
        .order("data_atualizacao", { ascending: false });

      if (error) throw error;

      // Parse dos campos JSON
      return (data || []).map((item) => ({
        ...item,
        previsao_2025_parsed: safeJsonParse<PrevisaoMensal[]>(item.previsao_2025),
        previsao_2026_parsed: safeJsonParse<PrevisaoMensal[]>(item.previsao_2026),
        comparativos_parsed: safeJsonParse<Comparativo[]>(item.comparativos),
      })) as DashboardData[];
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false,
  });

  // Query para estoque_atual
  const {
    data: estoqueAtual,
    isLoading: estoqueLoading,
    error: estoqueError,
    refetch: refetchEstoque,
  } = useQuery({
    queryKey: ["estoque_atual"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_atual")
        .select("*")
        .order("produto", { ascending: true });

      if (error) throw error;
      return (data || []) as EstoqueAtual[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Função para carregar estoque resumido sob demanda
  const loadEstoqueResumido = async (): Promise<EstoqueResumido[]> => {
    const { data, error } = await supabase
      .from("estoque_resumido")
      .select("*")
      .order("produto", { ascending: true });

    if (error) throw error;
    return (data || []) as EstoqueResumido[];
  };

  const loading = dashboardLoading || estoqueLoading;
  const error = dashboardError || estoqueError;

  return {
    dashboardData: dashboardData || [],
    estoqueAtual: estoqueAtual || [],
    loadEstoqueResumido,
    loading,
    error,
    refetch: () => {
      refetchDashboard();
      refetchEstoque();
    },
  };
}
