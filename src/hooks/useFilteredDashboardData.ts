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

      // Filtro de marcas
      if (filters.marcas.length > 0) {
        if (!item.marca || !filters.marcas.includes(item.marca)) {
          return false;
        }
      }

      // Filtro de ano - verifica se há previsões OU vendas no ano anterior (para calcular previsão)
      if (filters.ano) {
        const anoSelecionado = parseInt(filters.ano);
        const anoAnterior = anoSelecionado - 1;
        
        // Verificar se tem previsões para o ano selecionado
        const hasPrevisoesAno = item.previsoes?.some((p) => {
          const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
          return anoNum === anoSelecionado;
        }) || false;
        
        // Verificar se tem vendas no ano anterior (para calcular previsão via fallback)
        const hasVendasAnoAnterior = item.vendas_reais?.some((v) => {
          return v.ano === anoAnterior;
        }) || false;
        
        // Verificar se tem vendas no ano selecionado
        const hasVendasAnoSelecionado = item.vendas_reais?.some((v) => {
          return v.ano === anoSelecionado;
        }) || false;
        
        // Incluir se tem previsões, vendas no ano selecionado, ou vendas no ano anterior
        if (!hasPrevisoesAno && !hasVendasAnoAnterior && !hasVendasAnoSelecionado) return false;
        
        // Filtro de mês dentro do ano
        if (filters.mes) {
          const mesMap: Record<string, number> = {
            'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
            'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
          };
          
          // Verificar previsão para o mês/ano
          const hasPrevisoesAnoMes = item.previsoes?.some((p) => {
            const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
            const mesStr = String(p.mes).toLowerCase();
            const mesNum = mesMap[mesStr] || parseInt(String(p.mes));
            return anoNum === anoSelecionado && mesNum === filters.mes;
          }) || false;
          
          // Verificar vendas no mês/ano anterior (para calcular previsão via fallback)
          const hasVendasMesAnoAnterior = item.vendas_reais?.some((v) => {
            return v.ano === anoAnterior && v.mes === filters.mes;
          }) || false;
          
          // Verificar vendas no mês/ano selecionado
          const hasVendasMesAnoSelecionado = item.vendas_reais?.some((v) => {
            return v.ano === anoSelecionado && v.mes === filters.mes;
          }) || false;
          
          // Incluir se tem previsões para o mês, vendas no mês do ano selecionado, ou vendas no mês do ano anterior
          if (!hasPrevisoesAnoMes && !hasVendasMesAnoAnterior && !hasVendasMesAnoSelecionado) return false;
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

      // Filtro de marcas
      if (filters.marcas.length > 0) {
        if (!item.marca || !filters.marcas.includes(item.marca)) {
          return false;
        }
      }

      return true;
    });
  }, [estoqueAtual, filters]);

  return {
    filteredDashboard,
    filteredEstoque,
  };
}
