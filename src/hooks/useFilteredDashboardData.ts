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

      // Não filtrar por ano/mês - mostrar todos os produtos mesmo sem previsão
      // O filtro de ano/mês é apenas para exibir os valores corretos na tabela

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
