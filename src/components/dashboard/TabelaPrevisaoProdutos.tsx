import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardData, EstoqueAtual } from "@/hooks/useSupabaseDashboardData";
import { cleanProductName } from "@/lib/product-utils";
import {
  getQuarter,
  isMonthInPast,
  isMonthInFuture,
  isWithinTwoMonths,
  getPreviousMonth,
} from "@/lib/date-utils";
import { ArrowUpDown, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [sortField, setSortField] = useState<SortField>("produto");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Preparar dados da tabela
  const tableData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const defaultAno = anoSelecionado ? parseInt(anoSelecionado) : currentYear;
    const defaultMes = mesSelecionado || new Date().getMonth() + 1;

    return data.map((item) => {
      // 1. Nome do produto limpo
      const produtoLimpo = cleanProductName(item.produto);

      // 2. Código e Cliente
      const codigoProduto = item.codigo_produto || "";
      const cliente = item.cliente || "";

      // 3. Previsão do mês selecionado
      const previsaoKey = anoSelecionado === "2026" ? "previsao_2026_parsed" : "previsao_2025_parsed";
      const previsoes = item[previsaoKey] || [];
      const previsaoMes = Array.isArray(previsoes)
        ? previsoes.find((p) => p.mes === defaultMes)
        : null;
      const previsaoValor = previsaoMes?.quantidade || 0;

      // 4. Realizado (mês anterior) - apenas se mês for passado
      let realizadoValor = 0;
      const isPast = isMonthInPast(defaultMes, defaultAno);
      if (isPast) {
        const { mes: mesPrevio, ano: anoPrevio } = getPreviousMonth(defaultMes, defaultAno);
        // Tentamos buscar dados reais do ano anterior
        // Nota: precisa de campo dados_reais_2025 ou dados_reais_2024 na base
        // Por enquanto, deixaremos como 0 ou podemos buscar do histórico
        realizadoValor = 0; // TODO: implementar busca de dados reais
      }

      // 5. Estoque Atual
      const estoqueItem = estoqueAtual.find((e) => e.codigo_produto === codigoProduto);
      const estoqueValor = estoqueItem?.quantidade_disponivel || 0;

      // 6. Variação Trimestral
      const trimestre = getQuarter(defaultMes);
      const comparativos = item.comparativos_parsed || [];
      let variacaoTrimestral = 0;
      
      if (Array.isArray(comparativos)) {
        const compTrimestre = comparativos.find((c) => 
          c.periodo && c.periodo.toUpperCase().includes(trimestre)
        );
        variacaoTrimestral = compTrimestre?.variacao || 0;
      }

      // 7. Alertas
      const alertas = item.alertas || [];

      // Regras de destaque
      const isFuture = isMonthInFuture(defaultMes, defaultAno);
      const isOperational = isWithinTwoMonths(defaultMes, defaultAno);

      return {
        id: item.id,
        produto: produtoLimpo,
        codigo: codigoProduto,
        cliente,
        previsao: previsaoValor,
        realizado: isPast ? realizadoValor : null,
        estoque: estoqueValor,
        variacao: variacaoTrimestral,
        alertas,
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatNumber = (num: number | null): string => {
    if (num === null || num === 0) return "—";
    return num.toLocaleString("pt-BR");
  };

  const getVariacaoColor = (variacao: number) => {
    if (variacao > 10) return "text-success";
    if (variacao < -10) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    row.isOperational && "bg-primary/5"
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
                      row.isOperational && "text-primary"
                    )}
                  >
                    {formatNumber(row.previsao)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.isPast ? formatNumber(row.realizado) : "—"}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(row.estoque)}</TableCell>
                  <TableCell className="text-right">
                    {row.variacao !== 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex items-center gap-1 justify-end cursor-help",
                                getVariacaoColor(row.variacao)
                              )}
                            >
                              <TrendingUp className="h-3 w-3" />
                              {row.variacao > 0 ? "+" : ""}
                              {row.variacao.toFixed(1)}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover">
                            <p>Variação trimestral: {row.variacao.toFixed(2)}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      "—"
                    )}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
