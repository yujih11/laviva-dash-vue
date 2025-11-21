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
      if (filters.clientes.length > 0 && !filters.clientes.includes(item.cliente || "")) {
        return false;
      }

      // Filtro de ano - verifica se há dados para o ano selecionado
      if (filters.ano) {
        const previsaoKey = filters.ano === "2025" ? "previsao_2025_parsed" : "previsao_2026_parsed";
        const previsao = item[previsaoKey];
        
        // Verifica se há dados de previsão
        if (!previsao) return false;
        
        // Suporta tanto array quanto objeto
        if (Array.isArray(previsao)) {
          if (previsao.length === 0) return false;
          
          // Filtro de mês dentro do ano
          if (filters.mes) {
            const mesData = previsao.find((p) => p.mes === filters.mes);
            if (!mesData) return false;
          }
        } else if (typeof previsao === "object") {
          const valores = Object.keys(previsao);
          if (valores.length === 0) return false;
          
          // Filtro de mês dentro do ano (formato objeto)
          if (filters.mes) {
            const nomeMes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][filters.mes - 1];
            if (!(nomeMes in previsao)) return false;
          }
        } else {
          return false;
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
