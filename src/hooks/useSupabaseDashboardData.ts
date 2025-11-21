import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Helper para converter número do mês em nome de 3 letras minúsculo
export const mesParaNome = (mes: number): string => {
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return nomes[mes - 1] || "";
};

// Helper para extrair valor de previsão de forma segura
export const extrairPrevisao = (previsaoData: any, mes: number): number => {
  if (!previsaoData) return 0;
  
  // Se for array (formato novo)
  if (Array.isArray(previsaoData)) {
    const mesData = previsaoData.find((p) => p.mes === mes);
    return Number(mesData?.quantidade ?? 0);
  }
  
  // Se for objeto (formato antigo com chaves "jan", "fev", etc)
  if (typeof previsaoData === "object") {
    const nomeMes = mesParaNome(mes);
    const valor = previsaoData[nomeMes];
    return Number(valor ?? 0);
  }
  
  return 0;
};

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
  previsao_2025_parsed: PrevisaoMensal[] | Record<string, number> | null;
  previsao_2026_parsed: PrevisaoMensal[] | Record<string, number> | null;
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

// Função helper para parse seguro de JSON com validação de array
function safeJsonParse<T>(data: any): T | null {
  if (!data) return null;
  
  // Se já é um objeto, retorna diretamente
  if (typeof data === "object" && !Array.isArray(data) && data !== null) {
    return data as T;
  }
  
  // Se é string, tenta fazer parse
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  
  // Se já é array, retorna diretamente
  if (Array.isArray(data)) {
    return data as T;
  }
  
  return null;
}

// Helper para garantir que o resultado é um array
function ensureArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  // Se for um objeto com propriedades numéricas, converte para array
  if (typeof data === "object") {
    const values = Object.values(data);
    if (values.length > 0 && values.every(v => typeof v === "object")) {
      return values as T[];
    }
  }
  return [];
}

// Helper para normalizar dados de previsão - aceita tanto array quanto objeto
function normalizePrevisaoData(data: any): any {
  if (!data) return [];
  
  // Se já é array, retorna como está
  if (Array.isArray(data)) return data;
  
  // Se é objeto com chaves de mês ("jan", "fev", etc), retorna o objeto original
  // para ser processado pela função extrairPrevisao
  if (typeof data === "object") {
    return data;
  }
  
  return [];
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

      // Parse dos campos JSON - normaliza tanto array quanto objeto
      return (data || []).map((item) => ({
        ...item,
        previsao_2025_parsed: normalizePrevisaoData(item.previsao_2025),
        previsao_2026_parsed: normalizePrevisaoData(item.previsao_2026),
        comparativos_parsed: ensureArray<Comparativo>(item.comparativos),
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
