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
      const cleanedProduto = item.produto?.trim() || "";
      
      // Filtro de produtos (comparar com nome limpo)
      if (filters.produtos.length > 0) {
        const matchesProduto = filters.produtos.some(
          (filterProduto) => cleanedProduto.includes(filterProduto) || filterProduto.includes(cleanedProduto)
        );
        if (!matchesProduto) return false;
      }

      // Filtro de clientes
      if (filters.clientes.length > 0) {
        const itemCliente = item.cliente || "";
        if (!filters.clientes.includes(itemCliente)) {
          return false;
        }
      }

      // Filtro de ano - verifica se há previsões para o ano selecionado
      if (filters.ano && item.previsoes) {
        const hasPrevisoesAno = item.previsoes.some((p) => p.ano === filters.ano);
        if (!hasPrevisoesAno) return false;
        
        // Filtro de mês dentro do ano
        if (filters.mes) {
          const hasPrevisoesAnoMes = item.previsoes.some(
            (p) => p.ano === filters.ano && p.mes === String(filters.mes)
          );
          if (!hasPrevisoesAnoMes) return false;
        }
      }

      return true;
    });
  }, [dashboardData, filters]);

  const filteredEstoque = useMemo(() => {
    return estoqueAtual.filter((item) => {
      const cleanedProduto = item.produto?.trim() || "";
      
      // Filtro de produtos (comparar com nome limpo)
      if (filters.produtos.length > 0) {
        const matchesProduto = filters.produtos.some(
          (filterProduto) => cleanedProduto.includes(filterProduto) || filterProduto.includes(cleanedProduto)
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
