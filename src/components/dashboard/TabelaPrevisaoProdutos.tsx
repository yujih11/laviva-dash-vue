import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { calcularAlertas } from "@/lib/alertas-utils";
import { MiniGraficoComparacao } from "./MiniGraficoComparacao";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  DashboardData, 
  EstoqueAtual, 
  extrairPrevisao, 
  extrairVendasReais 
} from "@/hooks/useSupabaseDashboardData";
import { cleanProductName } from "@/lib/product-utils";
import {
  getQuarter,
  isMonthInPast,
  isMonthInFuture,
  isWithinTwoMonths,
  getPreviousMonth,
  getMonthName,
} from "@/lib/date-utils";
import { formatNumber, formatPercentage, getVariationColor } from "@/lib/format-utils";
import { exportToExcel, formatPrevisaoDataForExport } from "@/lib/excel-export";
import { ArrowUpDown, TrendingUp, TrendingDown, AlertTriangle, Info, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TabelaPrevisaoProdutosProps {
  data: DashboardData[];
  estoqueAtual: EstoqueAtual[];
  mesSelecionado: number | null;
  anoSelecionado: "2025" | "2026" | null;
}

type SortField = "produto" | "codigo" | "cliente" | "previsao" | "estoque";
type SortDirection = "asc" | "desc";

export function TabelaPrevisaoProdutos({
  data,
  estoqueAtual,
  mesSelecionado,
  anoSelecionado,
}: TabelaPrevisaoProdutosProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("produto");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [alertasMap, setAlertasMap] = useState<Map<string, string[]>>(new Map());
  const [editandoCodigo, setEditandoCodigo] = useState<string | null>(null);
  const [editandoValor, setEditandoValor] = useState<string>("");
  const { filters } = useDashboardFilters();

  // Calcular alertas quando os dados mudarem
  useEffect(() => {
    const calcular = async () => {
      const alertas = await calcularAlertas(
        data,
        mesSelecionado,
        anoSelecionado ? parseInt(anoSelecionado) : null
      );
      setAlertasMap(alertas);
    };
    calcular();
  }, [data, mesSelecionado, anoSelecionado]);

  // Preparar dados da tabela
  const tableData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const defaultAno = anoSelecionado ? parseInt(anoSelecionado) : currentYear;
    const defaultMes = mesSelecionado || new Date().getMonth() + 1;

    return data.map((item) => {
      // 1. Nome do produto limpo
      const produtoLimpo = cleanProductName(item.produto);
      const codigoProduto = item.codigo_produto;

      // 2. Previsão do mês selecionado
      const previsaoValor = extrairPrevisao(item.previsoes, defaultMes, defaultAno);

      // 3. Vendas reais do mês
      const realizadoValor = extrairVendasReais(item.vendas_reais, defaultMes, defaultAno);

      // 4. Estoque Atual
      const estoqueItem = estoqueAtual.find((e) => e.codigo_produto === codigoProduto);
      const estoqueValor = estoqueItem?.quantidade_disponivel || 0;

      // 5. Variação entre previsão e realizado (simplificado)
      let variacaoTrimestral = 0;
      if (realizadoValor > 0 && previsaoValor > 0) {
        variacaoTrimestral = ((realizadoValor - previsaoValor) / previsaoValor) * 100;
      }

      // 6. Regras de destaque
      const isPast = isMonthInPast(defaultMes, defaultAno);
      const isFuture = isMonthInFuture(defaultMes, defaultAno);
      const isOperational = isWithinTwoMonths(defaultMes, defaultAno);

      // 7. Cliente - se não houver filtro de cliente, mostrar "Todos"
      let cliente = "";
      if (filters.clientes.length === 0) {
        cliente = "Todos";
      } else if (item.previsoes.length > 0) {
        const mesMap: Record<string, number> = {
          'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
          'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
        };
        
        const previsao = item.previsoes.find((p) => {
          const mesStr = String(p.mes).toLowerCase();
          const mesNum = mesMap[mesStr] || parseInt(String(p.mes));
          const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
          return mesNum === defaultMes && anoNum === defaultAno;
        });
        
        if (previsao?.previsao_por_cliente) {
          const clientes = Object.keys(previsao.previsao_por_cliente);
          cliente = clientes.length > 0 ? clientes.join(", ") : "";
        }
      }

      // 8. Buscar alertas do mapa
      const alertasProduto = alertasMap.get(codigoProduto) || [];

      // 9. Crescimento
      const crescimento = item.crescimento_percentual || 10;

      return {
        id: codigoProduto,
        produto: produtoLimpo,
        codigo: codigoProduto,
        cliente,
        previsao: previsaoValor,
        realizado: isPast ? realizadoValor : null,
        estoque: estoqueValor,
        variacao: variacaoTrimestral,
        alertas: alertasProduto,
        crescimento,
        isPast,
        isFuture,
        isOperational,
      };
    });
  }, [data, estoqueAtual, mesSelecionado, anoSelecionado]);

  // Ordenação
  const sortedData = useMemo(() => {
    const sorted = [...tableData].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "produto":
          comparison = a.produto.localeCompare(b.produto);
          break;
        case "codigo":
          comparison = a.codigo.localeCompare(b.codigo);
          break;
        case "cliente":
          comparison = a.cliente.localeCompare(b.cliente);
          break;
        case "previsao":
          comparison = a.previsao - b.previsao;
          break;
        case "estoque":
          comparison = a.estoque - b.estoque;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [tableData, sortField, sortDirection]);

  // Retornar todos os dados ordenados (não filtrar por valores zero)
  const filteredData = useMemo(() => {
    return sortedData;
  }, [sortedData, alertasMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = formatPrevisaoDataForExport(
        filteredData,
        mesSelecionado,
        anoSelecionado ? parseInt(anoSelecionado) : null
      );

      const monthName = mesSelecionado ? getMonthName(mesSelecionado).toLowerCase() : "todos";
      const year = anoSelecionado || new Date().getFullYear();
      const filename = `previsao_laviva_${year}_${monthName}`;

      exportToExcel(exportData, filename, "Previsão de Produção");
      
      toast.success("Exportação concluída", {
        description: "Os dados foram exportados para Excel com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro na exportação", {
        description: "Não foi possível exportar os dados. Tente novamente.",
      });
    }
  };

  const handleIniciarEdicao = (codigo: string, crescimentoAtual: number) => {
    setEditandoCodigo(codigo);
    setEditandoValor(String(crescimentoAtual));
  };

  const handleSalvarCrescimento = async (codigo: string) => {
    const novoValor = parseFloat(editandoValor);
    if (isNaN(novoValor)) {
      toast.error("Valor inválido", {
        description: "Digite um número válido para o percentual de crescimento.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("crescimento_produtos")
        .upsert(
          {
            codigo_produto: codigo,
            percentual_crescimento: novoValor,
          },
          { onConflict: "codigo_produto" }
        );

      if (error) throw error;

      toast.success("Crescimento atualizado", {
        description: "O percentual foi salvo com sucesso.",
      });

      setEditandoCodigo(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar crescimento:", error);
      toast.error("Erro ao salvar", {
        description: "Não foi possível atualizar o crescimento.",
      });
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoCodigo(null);
    setEditandoValor("");
  };

  return (
    <>
    <div className="space-y-4">
      {/* Botão de Exportar */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportExcel}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={filteredData.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar para Excel
        </Button>
      </div>
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <button
                  onClick={() => handleSort("produto")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Produto
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("codigo")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Código
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("cliente")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Cliente
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("previsao")}
                  className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                >
                  Previsão
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Realizado</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("estoque")}
                  className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                >
                  Estoque
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 justify-end cursor-help">
                        Crescimento
                        <Info className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover">
                      <p>Clique no valor para editar o percentual de crescimento</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 justify-end cursor-help">
                        Variação Trim.
                        <Info className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover">
                      <p>Variação de produção entre previsão e realizado neste trimestre</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>Alerta</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    row.isOperational && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {row.produto}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.codigo}</TableCell>
                  <TableCell>{row.cliente}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      row.isOperational && "text-primary font-bold"
                    )}
                  >
                    {formatNumber(row.previsao)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.isPast ? formatNumber(row.realizado) : "—"}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(row.estoque)}</TableCell>
                  <TableCell className="text-right">
                    {editandoCodigo === row.codigo ? (
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          value={editandoValor}
                          onChange={(e) => setEditandoValor(e.target.value)}
                          className="w-16 px-2 py-1 text-sm border rounded text-right"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSalvarCrescimento(row.codigo);
                            if (e.key === "Escape") handleCancelarEdicao();
                          }}
                        />
                        <span className="text-sm">%</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSalvarCrescimento(row.codigo)}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={handleCancelarEdicao}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleIniciarEdicao(row.codigo, row.crescimento)}
                        className="text-sm font-medium hover:underline cursor-pointer"
                      >
                        {row.crescimento}%
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MiniGraficoComparacao
                      previsao={row.previsao}
                      realizado={row.realizado}
                    />
                  </TableCell>
                  <TableCell>
                    {row.alertas && Array.isArray(row.alertas) && row.alertas.length > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="destructive"
                              className="cursor-help gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {row.alertas.length}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover max-w-[300px]">
                            <div className="space-y-1">
                              {row.alertas.map((alerta, idx) => (
                                <p key={idx} className="text-sm">
                                  • {alerta}
                                </p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="text-success border-success/50">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/produto/${row.codigo}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </div>
    </>
  );
}
