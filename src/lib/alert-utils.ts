import { DashboardData } from "@/hooks/useSupabaseDashboardData";
import { cleanProductName } from "./product-utils";

export interface AlertaAgrupado {
  tipo: string;
  severidade: "critico" | "moderado" | "info";
  produtos: Array<{
    id: string;
    produto: string;
    cliente: string;
    codigo: string;
    alertas: string[];
  }>;
}

/**
 * Categoriza um alerta baseado em palavras-chave
 */
function categorizarAlerta(alerta: string): { tipo: string; severidade: "critico" | "moderado" | "info" } {
  const alertaLower = alerta.toLowerCase();

  // Críticos - Ruptura de Estoque
  if (
    alertaLower.includes("ruptura") ||
    alertaLower.includes("estoque baixo") ||
    alertaLower.includes("falta") ||
    alertaLower.includes("crítico") ||
    alertaLower.includes("urgente")
  ) {
    return { tipo: "Ruptura de Estoque", severidade: "critico" };
  }

  // Moderados - Produto Parado
  if (
    alertaLower.includes("parado") ||
    alertaLower.includes("sem venda") ||
    alertaLower.includes("inativo") ||
    alertaLower.includes("atenção")
  ) {
    return { tipo: "Produto Parado", severidade: "moderado" };
  }

  // Info - Venda Inesperada
  if (
    alertaLower.includes("inesperado") ||
    alertaLower.includes("aumento") ||
    alertaLower.includes("pico") ||
    alertaLower.includes("crescimento")
  ) {
    return { tipo: "Venda Inesperada", severidade: "info" };
  }

  // Moderados - Previsão Divergente
  if (
    alertaLower.includes("divergente") ||
    alertaLower.includes("discrepância") ||
    alertaLower.includes("diferença")
  ) {
    return { tipo: "Previsão Divergente", severidade: "moderado" };
  }

  // Padrão
  return { tipo: "Outros Alertas", severidade: "moderado" };
}

/**
 * Agrupa alertas por tipo e organiza os produtos afetados
 */
export function agruparAlertas(data: DashboardData[]): AlertaAgrupado[] {
  const grupos = new Map<string, AlertaAgrupado>();

  // Iterar sobre todos os produtos com alertas
  data.forEach((item) => {
    if (!item.alertas || !Array.isArray(item.alertas) || item.alertas.length === 0) {
      return;
    }

    const produtoInfo = {
      id: item.id,
      produto: cleanProductName(item.produto),
      cliente: item.cliente || "Cliente não informado",
      codigo: item.codigo_produto || "",
      alertas: item.alertas,
    };

    // Para cada alerta do produto, categorizar e agrupar
    item.alertas.forEach((alerta) => {
      const { tipo, severidade } = categorizarAlerta(alerta);

      if (!grupos.has(tipo)) {
        grupos.set(tipo, {
          tipo,
          severidade,
          produtos: [],
        });
      }

      const grupo = grupos.get(tipo)!;
      
      // Adicionar produto ao grupo se ainda não estiver lá
      if (!grupo.produtos.find((p) => p.id === item.id)) {
        grupo.produtos.push(produtoInfo);
      }
    });
  });

  // Converter para array e ordenar por severidade
  const resultado = Array.from(grupos.values());
  
  const ordemSeveridade = { critico: 0, moderado: 1, info: 2 };
  resultado.sort((a, b) => ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade]);

  return resultado;
}
