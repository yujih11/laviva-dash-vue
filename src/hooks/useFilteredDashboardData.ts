import { useMemo } from "react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { DashboardData, EstoqueAtual } from "./useSupabaseDashboardData";

export function useFilteredDashboardData(
  dashboardData: DashboardData[],
  estoqueAtual: EstoqueAtual[]
) {
  const { filters } = useDashboardFilters();

  const filteredDashboard = useMemo(() => {
    return dashboardData.filter((item) => {
      // Filtro de produtos (comparar por codigo_produto único)
      if (filters.produtos.length > 0) {
        const matchesProduto = filters.produtos.some(
          (filterProduto) => item.codigo_produto === filterProduto
        );
        if (!matchesProduto) return false;
      }

      // Filtro de clientes - verificar se algum cliente do item está nos filtros
      if (filters.clientes.length > 0) {
        const itemClientes = item.cliente?.split(",").map(c => c.trim()) || [];
        const hasMatchingCliente = itemClientes.some(c => filters.clientes.includes(c));
        if (!hasMatchingCliente) {
          return false;
        }
      }

      // Filtro de ano - verifica se há previsões para o ano selecionado
      if (filters.ano && item.previsoes) {
        const hasPrevisoesAno = item.previsoes.some((p) => {
          const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
          return anoNum === parseInt(filters.ano);
        });
        if (!hasPrevisoesAno) return false;
        
        // Filtro de mês dentro do ano
        if (filters.mes) {
          const mesMap: Record<string, number> = {
            'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
            'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
          };
          
          const hasPrevisoesAnoMes = item.previsoes.some((p) => {
            const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
            const mesStr = String(p.mes).toLowerCase();
            const mesNum = mesMap[mesStr] || parseInt(String(p.mes));
            return anoNum === parseInt(filters.ano) && mesNum === filters.mes;
          });
          if (!hasPrevisoesAnoMes) return false;
        }
      }

      return true;
    });
  }, [dashboardData, filters]);

  const filteredEstoque = useMemo(() => {
    return estoqueAtual.filter((item) => {
      // Filtro de produtos (comparar por codigo_produto único)
      if (filters.produtos.length > 0) {
        const matchesProduto = filters.produtos.some(
          (filterProduto) => item.codigo_produto === filterProduto
        );
        if (!matchesProduto) return false;
      }

      return true;
    });
  }, [estoqueAtual, filters]);

  return {
    filteredDashboard,
    filteredEstoque,
  };
}
