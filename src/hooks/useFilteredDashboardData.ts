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
      // Filtro de produtos
      if (filters.produtos.length > 0 && !filters.produtos.includes(item.produto || "")) {
        return false;
      }

      // Filtro de clientes
      if (filters.clientes.length > 0 && !filters.clientes.includes(item.cliente || "")) {
        return false;
      }

      // Filtro de ano - verifica se há dados para o ano selecionado
      if (filters.ano) {
        const previsaoKey = filters.ano === "2025" ? "previsao_2025_parsed" : "previsao_2026_parsed";
        const previsao = item[previsaoKey];
        
        if (!previsao || !Array.isArray(previsao) || previsao.length === 0) {
          return false;
        }

        // Filtro de mês dentro do ano
        if (filters.mes) {
          const mesData = previsao.find((p) => p.mes === filters.mes);
          if (!mesData) {
            return false;
          }
        }
      }

      return true;
    });
  }, [dashboardData, filters]);

  const filteredEstoque = useMemo(() => {
    return estoqueAtual.filter((item) => {
      // Filtro de produtos
      if (filters.produtos.length > 0 && !filters.produtos.includes(item.produto || "")) {
        return false;
      }

      return true;
    });
  }, [estoqueAtual, filters]);

  return {
    filteredDashboard,
    filteredEstoque,
  };
}
