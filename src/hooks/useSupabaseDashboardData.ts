import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Tipos para os dados das novas tabelas
export interface VendasReais {
  codigo_produto: string | null;
  produto: string | null;
  ano: number | null;
  mes: number | null;
  total_vendido: number | null;
  vendas_por_cliente: any; // jsonb com detalhes por cliente
}

export interface PrevisaoResumida {
  codigo_produto: string | null;
  produto: string | null;
  ano: string | null;
  mes: string | null;
  total_previsto: number | null;
  previsao_por_cliente: any; // jsonb com detalhes por cliente
}

export interface CrescimentoProduto {
  codigo_produto: string;
  percentual_crescimento: number | null;
}

// Interface principal para o dashboard
export interface DashboardData {
  id?: string; // Para compatibilidade
  codigo_produto: string;
  produto: string;
  cliente?: string; // Extraído dinamicamente dos dados
  vendas_reais: VendasReais[];
  previsoes: PrevisaoResumida[];
  crescimento_percentual: number | null;
  crescimento_manual?: number | null; // Alias para compatibilidade
  alertas?: string[]; // Calculado dinamicamente
  // Compatibilidade com código antigo
  previsao_2025_parsed?: any;
  previsao_2026_parsed?: any;
}

export interface EstoqueAtual extends Tables<"estoque_atual"> {}

export interface EstoqueResumido {
  codigo_produto: string | null;
  produto: string | null;
  marca: string | null;
  estoque_total: number | null;
  estoque_disponivel: number | null;
}

// Mapeamento de meses em português para números
const mesMap: Record<string, number> = {
  'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
  'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
};

// Helper para extrair valor de previsão do mês
export const extrairPrevisao = (previsoes: PrevisaoResumida[], mes: number, ano: number): number => {
  const previsao = previsoes.find((p) => {
    const mesNum = typeof p.mes === 'string' ? mesMap[p.mes.toLowerCase()] || parseInt(p.mes) : p.mes;
    const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
    return mesNum === mes && anoNum === ano;
  });
  return Number(previsao?.total_previsto ?? 0);
};

// Helper para extrair vendas reais do mês
export const extrairVendasReais = (vendas: VendasReais[], mes: number, ano: number): number => {
  const venda = vendas.find((v) => v.mes === mes && v.ano === ano);
  return Number(venda?.total_vendido ?? 0);
};

export function useSupabaseDashboardData() {
  // Query para vendas reais resumidas por código
  const {
    data: vendasReais,
    isLoading: vendasLoading,
    error: vendasError,
  } = useQuery({
    queryKey: ["vendas_reais_resumidas_por_codigo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas_reais_resumidas_por_codigo")
        .select("*")
        .order("codigo_produto", { ascending: true });

      if (error) throw error;
      return (data || []) as VendasReais[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Query para previsões resumidas por código
  const {
    data: previsoes,
    isLoading: previsoesLoading,
    error: previsoesError,
  } = useQuery({
    queryKey: ["previsao_resumida_por_codigo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("previsao_resumida_por_codigo")
        .select("*")
        .order("codigo_produto", { ascending: true });

      if (error) throw error;
      return (data || []) as PrevisaoResumida[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Query para crescimento de produtos
  const {
    data: crescimentos,
    isLoading: crescimentosLoading,
    error: crescimentosError,
  } = useQuery({
    queryKey: ["crescimento_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crescimento_produtos")
        .select("*");

      if (error) throw error;
      return (data || []) as CrescimentoProduto[];
    },
    staleTime: 1000 * 60 * 5,
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

  // Combinar dados em estrutura consolidada
  const dashboardData: DashboardData[] = [];
  
  // Agrupar por código de produto
  const codigosProdutos = new Set<string>();
  vendasReais?.forEach((v) => v.codigo_produto && codigosProdutos.add(v.codigo_produto));
  previsoes?.forEach((p) => p.codigo_produto && codigosProdutos.add(p.codigo_produto));

  codigosProdutos.forEach((codigo) => {
    const vendas = vendasReais?.filter((v) => v.codigo_produto === codigo) || [];
    const prevs = previsoes?.filter((p) => p.codigo_produto === codigo) || [];
    const crescimento = crescimentos?.find((c) => c.codigo_produto === codigo);
    
    // Pegar nome do produto (de vendas ou previsões)
    const produto = vendas[0]?.produto || prevs[0]?.produto || codigo;

    // Extrair clientes únicos das previsões
    const clientesSet = new Set<string>();
    prevs.forEach((p) => {
      if (p.previsao_por_cliente) {
        Object.keys(p.previsao_por_cliente).forEach((c) => clientesSet.add(c));
      }
    });
    const cliente = Array.from(clientesSet).join(", ");

    // Calcular previsões por ano para compatibilidade
    const previsao_2025 = prevs
      .filter((p) => {
        const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
        return anoNum === 2025;
      })
      .reduce((acc, p) => {
        const mesStr = String(p.mes).toLowerCase();
        const mes = mesMap[mesStr] || parseInt(String(p.mes));
        if (!isNaN(mes) && mes >= 1 && mes <= 12) {
          acc[mes] = (acc[mes] || 0) + Number(p.total_previsto || 0);
        }
        return acc;
      }, {} as Record<number, number>);

    const previsao_2026 = prevs
      .filter((p) => {
        const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
        return anoNum === 2026;
      })
      .reduce((acc, p) => {
        const mesStr = String(p.mes).toLowerCase();
        const mes = mesMap[mesStr] || parseInt(String(p.mes));
        if (!isNaN(mes) && mes >= 1 && mes <= 12) {
          acc[mes] = (acc[mes] || 0) + Number(p.total_previsto || 0);
        }
        return acc;
      }, {} as Record<number, number>);

    dashboardData.push({
      id: codigo,
      codigo_produto: codigo,
      produto,
      cliente,
      vendas_reais: vendas,
      previsoes: prevs,
      crescimento_percentual: crescimento?.percentual_crescimento ?? 10, // Default 10%
      crescimento_manual: (crescimento?.percentual_crescimento ?? 10) / 100, // Para compatibilidade
      alertas: [], // Pode ser calculado posteriormente
      previsao_2025_parsed: previsao_2025,
      previsao_2026_parsed: previsao_2026,
    });
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

  const loading = vendasLoading || previsoesLoading || crescimentosLoading || estoqueLoading;
  const error = vendasError || previsoesError || crescimentosError || estoqueError;

  return {
    dashboardData,
    estoqueAtual: estoqueAtual || [],
    loadEstoqueResumido,
    loading,
    error,
    refetch: () => {
      refetchEstoque();
    },
  };
}
