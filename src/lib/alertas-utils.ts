import { DashboardData } from "@/hooks/useSupabaseDashboardData";
import { supabase } from "@/integrations/supabase/client";

interface UltimaVenda {
  codigo_produto: string | null;
  ultima_venda: string | null;
}

/**
 * Calcula alertas para cada produto baseado em:
 * 1. Última venda há mais de 60 dias
 * 2. Variação entre previsão e realizado maior que 25%
 */
export async function calcularAlertas(
  produtos: DashboardData[],
  mesSelecionado: number | null,
  anoSelecionado: number | null
): Promise<Map<string, string[]>> {
  const alertasPorProduto = new Map<string, string[]>();

  // Buscar última venda de cada produto
  const { data: ultimasVendas } = await supabase
    .from("vendas_reais_com_ultima_venda")
    .select("codigo_produto, ultima_venda");

  const ultimasVendasMap = new Map<string, Date>();
  if (ultimasVendas) {
    ultimasVendas.forEach((item: UltimaVenda) => {
      if (item.codigo_produto && item.ultima_venda) {
        // Pegar a data mais recente para cada código de produto
        const dataVenda = new Date(item.ultima_venda);
        const dataExistente = ultimasVendasMap.get(item.codigo_produto);
        if (!dataExistente || dataVenda > dataExistente) {
          ultimasVendasMap.set(item.codigo_produto, dataVenda);
        }
      }
    });
  }

  const hoje = new Date();
  const diasParaAlerta = 60;

  produtos.forEach((produto) => {
    const alertas: string[] = [];
    const codigoProduto = produto.codigo_produto;

    // Alerta 1: Produto parado (sem venda há mais de 60 dias)
    const ultimaVenda = ultimasVendasMap.get(codigoProduto);
    if (ultimaVenda) {
      const diasSemVenda = Math.floor(
        (hoje.getTime() - ultimaVenda.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasSemVenda > diasParaAlerta) {
        alertas.push(`Produto parado: sem vendas há ${diasSemVenda} dias`);
      }
    }

    // Alerta 2: Variação maior que 25% (se houver mês selecionado)
    if (mesSelecionado && anoSelecionado) {
      const mesMap: Record<string, number> = {
        'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
      };

      // Buscar previsão do mês
      const previsao = produto.previsoes.find((p) => {
        const mesNum = typeof p.mes === 'string' 
          ? mesMap[p.mes.toLowerCase()] || parseInt(p.mes) 
          : p.mes;
        const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
        return mesNum === mesSelecionado && anoNum === anoSelecionado;
      });

      // Buscar venda real do mês
      const vendaReal = produto.vendas_reais.find(
        (v) => v.mes === mesSelecionado && v.ano === anoSelecionado
      );

      if (previsao && vendaReal && previsao.total_previsto && vendaReal.total_vendido) {
        const previsaoValor = Number(previsao.total_previsto);
        const realizadoValor = Number(vendaReal.total_vendido);
        
        if (previsaoValor > 0) {
          const variacao = Math.abs(((realizadoValor - previsaoValor) / previsaoValor) * 100);
          
          if (variacao > 25) {
            const tipo = realizadoValor > previsaoValor ? "acima" : "abaixo";
            alertas.push(
              `Variação divergente: ${variacao.toFixed(0)}% ${tipo} da previsão`
            );
          }
        }
      }
    }

    if (alertas.length > 0) {
      alertasPorProduto.set(codigoProduto, alertas);
    }
  });

  return alertasPorProduto;
}
