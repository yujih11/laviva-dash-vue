import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

type SortField = "produto" | "codigo" | "cliente" | "previsaoVendas" | "previsaoProducao" | "estoque";
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
  const [editandoProducaoCodigo, setEditandoProducaoCodigo] = useState<string | null>(null);
  const [editandoProducaoValor, setEditandoProducaoValor] = useState<string>("");
  const { filters } = useDashboardFilters();
  
  // Buscar todos os crescimentos para usar na lógica
  const { data: crescimentos } = useQuery({
    queryKey: ["crescimento_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crescimento_produtos")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  // Buscar previsões de produção manuais
  const { data: previsoesManuais, refetch: refetchPrevisoesManuais } = useQuery({
    queryKey: ["previsao_producao_manual"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("previsao_producao_manual")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

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

  // Agregar estoque por código de produto (normalizado)
  const estoqueAgregado = useMemo(() => {
    const agregado = new Map<string, number>();
    
    estoqueAtual.forEach((item) => {
      // Normalizar código removendo zeros à esquerda
      const codigoNormalizado = item.codigo_produto.replace(/^0+/, '');
      const quantidadeAtual = agregado.get(codigoNormalizado) || 0;
      agregado.set(codigoNormalizado, quantidadeAtual + (item.quantidade_disponivel || 0));
    });
    
    return agregado;
  }, [estoqueAtual]);

  // Preparar dados da tabela
  const tableData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const defaultAno = anoSelecionado ? parseInt(anoSelecionado) : currentYear;
    const defaultMes = mesSelecionado || new Date().getMonth() + 1;

    return data.map((item) => {
      // 1. Nome do produto limpo
      const produtoLimpo = cleanProductName(item.produto);
      const codigoProduto = item.codigo_produto;
      const codigoNormalizado = codigoProduto.replace(/^0+/, '');

      // 2. Previsão base do mês selecionado (calculada originalmente com 10%)
      let previsaoBase = extrairPrevisao(item.previsoes, defaultMes, defaultAno);

      // 3. Vendas reais do mês atual e do ano anterior (para fallback)
      const realizadoValor = extrairVendasReais(item.vendas_reais, defaultMes, defaultAno);
      const vendasAnoAnterior = extrairVendasReais(item.vendas_reais, defaultMes, defaultAno - 1);
      
      // Buscar vendas recentes disponíveis (últimos 6 meses a partir da data atual)
      // Isso permite usar dados de Out/Nov 2025 mesmo ao visualizar Fev 2025
      const vendasRecentes: { mes: number; ano: number; valor: number }[] = [];
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth() + 1;
      const anoAtual = dataAtual.getFullYear();
      
      // Buscar nos últimos 6 meses a partir do mês atual (data real)
      for (let i = 1; i <= 6; i++) {
        let mesBusca = mesAtual - i;
        let anoBusca = anoAtual;
        if (mesBusca <= 0) {
          mesBusca += 12;
          anoBusca -= 1;
        }
        const vendaMes = extrairVendasReais(item.vendas_reais, mesBusca, anoBusca);
        if (vendaMes > 0) {
          vendasRecentes.push({ mes: mesBusca, ano: anoBusca, valor: vendaMes });
        }
      }
      
      // Também buscar no ano selecionado (caso seja diferente do atual)
      if (defaultAno !== anoAtual) {
        for (let mes = 1; mes <= 12; mes++) {
          const vendaMes = extrairVendasReais(item.vendas_reais, mes, defaultAno);
          if (vendaMes > 0 && !vendasRecentes.some(v => v.mes === mes && v.ano === defaultAno)) {
            vendasRecentes.push({ mes, ano: defaultAno, valor: vendaMes });
          }
        }
      }
      
      // Ordenar por data mais recente e pegar os 3 mais recentes para média
      vendasRecentes.sort((a, b) => (b.ano * 12 + b.mes) - (a.ano * 12 + a.mes));
      const topVendasRecentes = vendasRecentes.slice(0, 3);
      const mediaVendasRecentes = topVendasRecentes.length > 0 
        ? topVendasRecentes.reduce((a, b) => a + b.valor, 0) / topVendasRecentes.length 
        : 0;
      const mesesUsados = topVendasRecentes.map(v => `${v.mes}/${v.ano}`).join(', ');

      // 4. Estoque Atual - usar agregado por código normalizado
      const estoqueValor = estoqueAgregado.get(codigoNormalizado) || estoqueAgregado.get(codigoProduto) || 0;

      // 9. Crescimento - buscar valor específico por cliente/mês/ano ou usar padrão
      // Prioridade: cliente+mês+ano > mês+ano > ano > global > 10%
      let crescimento = 10; // padrão
      const clienteFiltro = filters.clientes.length === 1 ? filters.clientes[0] : null;
      
      if (crescimentos) {
        // 1. Buscar por cliente específico + mês + ano (se houver filtro de cliente único)
        if (clienteFiltro) {
          const crescClienteMesAno = crescimentos.find(c => 
            c.codigo_produto === codigoProduto && 
            c.cliente === clienteFiltro &&
            c.ano === defaultAno && 
            c.mes === defaultMes
          );
          if (crescClienteMesAno) {
            crescimento = crescClienteMesAno.percentual_crescimento || 10;
          }
        }
        
        // 2. Se não encontrou por cliente, buscar por mês e ano (geral)
        if (crescimento === 10) {
          const crescMesAno = crescimentos.find(c => 
            c.codigo_produto === codigoProduto && 
            c.cliente === null &&
            c.ano === defaultAno && 
            c.mes === defaultMes
          );
          
          if (crescMesAno) {
            crescimento = crescMesAno.percentual_crescimento || 10;
          } else {
            // 3. Buscar por ano específico (sem mês)
            const crescAno = crescimentos.find(c => 
              c.codigo_produto === codigoProduto && 
              c.cliente === null &&
              c.ano === defaultAno && 
              (c.mes === null || c.mes === 0)
            );
            
            if (crescAno) {
              crescimento = crescAno.percentual_crescimento || 10;
            } else {
              // 4. Buscar crescimento global (sem ano nem mês)
              const crescGlobal = crescimentos.find(c => 
                c.codigo_produto === codigoProduto && 
                c.cliente === null &&
                (c.ano === null || c.ano === 0) && 
                (c.mes === null || c.mes === 0)
              );
              
              if (crescGlobal) {
                crescimento = crescGlobal.percentual_crescimento || 10;
              }
            }
          }
        }
      }

      // Recalcular previsão com base no crescimento customizado
      // Se previsaoBase for 0 e houver vendas do ano anterior, calcular automaticamente
      let previsaoValor = previsaoBase;
      let previsaoOrigem: 'banco' | 'ano_anterior' | 'media_recente' | 'sem_dados' = 'banco';
      let previsaoExplicacao = '';
      
      // Fallback: se previsão for 0, tentar calcular
      if (previsaoBase === 0) {
        if (vendasAnoAnterior > 0) {
          // Usar vendas do ano anterior
          previsaoValor = Math.round(vendasAnoAnterior * (1 + crescimento / 100));
          previsaoOrigem = 'ano_anterior';
          previsaoExplicacao = `Calculado: ${formatNumber(vendasAnoAnterior)} vendas em ${defaultAno - 1} × ${crescimento}% crescimento`;
        } else if (mediaVendasRecentes > 0) {
          // Usar média das vendas recentes disponíveis
          previsaoValor = Math.round(mediaVendasRecentes * (1 + crescimento / 100));
          previsaoOrigem = 'media_recente';
          previsaoExplicacao = `Calculado: média de ${formatNumber(Math.round(mediaVendasRecentes))} (meses: ${mesesUsados}) × ${crescimento}% crescimento`;
        } else {
          // Sem dados para calcular
          previsaoOrigem = 'sem_dados';
          previsaoExplicacao = `Sem histórico de vendas em ${defaultAno - 1} e sem vendas recentes para calcular previsão`;
        }
      } else if (previsaoBase > 0) {
        if (crescimento !== 10) {
          // A previsão original foi calculada com 10%, então: base = previsaoBase / 1.10
          // Nova previsão = base * (1 + crescimento/100)
          const vendaBase = previsaoBase / 1.10; // Desfaz o 10% original
          previsaoValor = vendaBase * (1 + crescimento / 100);
          previsaoExplicacao = `Previsão ajustada: base × ${crescimento}% crescimento`;
        } else {
          // Previsão original do banco com crescimento padrão
          const vendaBase = previsaoBase / 1.10;
          previsaoExplicacao = `Calculado: ${formatNumber(Math.round(vendaBase))} vendas em ${defaultAno - 1} × ${crescimento}% crescimento`;
        }
      }

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
      // Se houver filtro, mostrar apenas o(s) cliente(s) selecionado(s)
      let cliente = "";
      if (filters.clientes.length === 0) {
        cliente = "Todos";
      } else {
        // Mostrar apenas o(s) cliente(s) selecionado(s) no filtro
        cliente = filters.clientes.join(", ");
      }

      // 8. Buscar alertas do mapa
      const alertasProduto = alertasMap.get(codigoProduto) || [];

      // 9. Previsão de Produção - verificar se tem valor manual
      const clienteFiltroProducao = filters.clientes.length === 1 ? filters.clientes[0] : null;
      let previsaoProducaoManual: number | null = null;
      
      if (previsoesManuais) {
        // Buscar previsão manual específica para cliente+mês+ano
        const manualClienteMesAno = previsoesManuais.find(p => 
          p.codigo_produto === codigoProduto && 
          p.cliente === clienteFiltroProducao &&
          p.ano === defaultAno && 
          p.mes === defaultMes
        );
        
        if (manualClienteMesAno) {
          previsaoProducaoManual = manualClienteMesAno.quantidade;
        } else {
          // Buscar previsão manual geral (sem cliente)
          const manualMesAno = previsoesManuais.find(p => 
            p.codigo_produto === codigoProduto && 
            p.cliente === null &&
            p.ano === defaultAno && 
            p.mes === defaultMes
          );
          if (manualMesAno) {
            previsaoProducaoManual = manualMesAno.quantidade;
          }
        }
      }

      // Usar valor manual se existir, senão calcular
      const previsaoProducaoCalculada = previsaoValor - estoqueValor;
      const previsaoProducao = previsaoProducaoManual !== null ? previsaoProducaoManual : previsaoProducaoCalculada;
      const isPrevisaoProducaoManual = previsaoProducaoManual !== null;

      return {
        id: codigoProduto,
        produto: produtoLimpo,
        codigo: codigoProduto,
        cliente,
        previsaoVendas: previsaoValor,
        previsaoProducao,
        previsaoProducaoCalculada,
        isPrevisaoProducaoManual,
        previsaoOrigem,
        previsaoExplicacao,
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
  }, [data, estoqueAgregado, mesSelecionado, anoSelecionado, alertasMap, filters.clientes, crescimentos, previsoesManuais]);

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
        case "previsaoVendas":
          comparison = a.previsaoVendas - b.previsaoVendas;
          break;
        case "previsaoProducao":
          comparison = a.previsaoProducao - b.previsaoProducao;
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
    if (isNaN(novoValor) && editandoValor.trim() !== "") {
      toast.error("Valor inválido", {
        description: "Digite um número válido para o percentual de crescimento.",
      });
      return;
    }

    try {
      const ano = anoSelecionado ? parseInt(anoSelecionado) : null;
      const mes = mesSelecionado;
      // Se houver filtro de 1 cliente, salva crescimento específico para esse cliente
      const clienteFiltro = filters.clientes.length === 1 ? filters.clientes[0] : null;

      // Se novoValor for 0 ou vazio, deletar o registro específico
      if (novoValor === 0 || editandoValor.trim() === "" || isNaN(novoValor)) {
        // Construir query de delete com null-safe comparison
        let deleteQuery = supabase
          .from("crescimento_produtos")
          .delete()
          .eq("codigo_produto", codigo);
        
        if (ano === null) {
          deleteQuery = deleteQuery.is("ano", null);
        } else {
          deleteQuery = deleteQuery.eq("ano", ano);
        }
        
        if (mes === null) {
          deleteQuery = deleteQuery.is("mes", null);
        } else {
          deleteQuery = deleteQuery.eq("mes", mes);
        }

        if (clienteFiltro === null) {
          deleteQuery = deleteQuery.is("cliente", null);
        } else {
          deleteQuery = deleteQuery.eq("cliente", clienteFiltro);
        }

        const { error } = await deleteQuery;

        if (error) throw error;

        toast.success("Crescimento removido", {
          description: "O crescimento customizado foi removido. Será usado o padrão (10%).",
        });
      } else {
        // Upsert com ano, mês e cliente para permitir configuração granular
        const { error } = await supabase
          .from("crescimento_produtos")
          .upsert(
            {
              codigo_produto: codigo,
              percentual_crescimento: novoValor,
              ano: ano,
              mes: mes,
              cliente: clienteFiltro,
            }
          );

        if (error) throw error;

        const clienteMsg = clienteFiltro ? ` para ${clienteFiltro}` : "";
        toast.success("Crescimento atualizado", {
          description: `Percentual salvo${clienteMsg} para ${mes ? `mês ${mes}` : "todos os meses"} de ${ano || "todos os anos"}.`,
        });
      }

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

  const handleIniciarEdicaoProducao = (codigo: string, producaoAtual: number) => {
    setEditandoProducaoCodigo(codigo);
    setEditandoProducaoValor(producaoAtual > 0 ? String(producaoAtual) : "");
  };

  const handleSalvarProducao = async (codigo: string) => {
    const novoValor = parseInt(editandoProducaoValor);
    
    try {
      const ano = anoSelecionado ? parseInt(anoSelecionado) : null;
      const mes = mesSelecionado;
      const clienteFiltro = filters.clientes.length === 1 ? filters.clientes[0] : null;

      // Se vazio ou 0, deletar o registro
      if (editandoProducaoValor.trim() === "" || novoValor === 0 || isNaN(novoValor)) {
        let deleteQuery = supabase
          .from("previsao_producao_manual")
          .delete()
          .eq("codigo_produto", codigo);
        
        if (ano === null) {
          deleteQuery = deleteQuery.is("ano", null);
        } else {
          deleteQuery = deleteQuery.eq("ano", ano);
        }
        
        if (mes === null) {
          deleteQuery = deleteQuery.is("mes", null);
        } else {
          deleteQuery = deleteQuery.eq("mes", mes);
        }

        if (clienteFiltro === null) {
          deleteQuery = deleteQuery.is("cliente", null);
        } else {
          deleteQuery = deleteQuery.eq("cliente", clienteFiltro);
        }

        const { error } = await deleteQuery;
        if (error) throw error;

        toast.success("Previsão removida", {
          description: "A previsão manual foi removida. Será usado o valor calculado.",
        });
      } else {
        const { error } = await supabase
          .from("previsao_producao_manual")
          .upsert({
            codigo_produto: codigo,
            quantidade: novoValor,
            ano: ano,
            mes: mes,
            cliente: clienteFiltro,
          });

        if (error) throw error;

        const clienteMsg = clienteFiltro ? ` para ${clienteFiltro}` : "";
        toast.success("Previsão salva", {
          description: `Previsão de produção${clienteMsg} salva: ${formatNumber(novoValor)} unidades.`,
        });
      }

      setEditandoProducaoCodigo(null);
      setEditandoProducaoValor("");
      refetchPrevisoesManuais();
    } catch (error) {
      console.error("Erro ao salvar previsão de produção:", error);
      toast.error("Erro ao salvar", {
        description: "Não foi possível salvar a previsão de produção.",
      });
    }
  };

  const handleCancelarEdicaoProducao = () => {
    setEditandoProducaoCodigo(null);
    setEditandoProducaoValor("");
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
                  onClick={() => handleSort("previsaoVendas")}
                  className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                >
                  Prev. Vendas
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
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
                      <button
                        onClick={() => handleSort("previsaoProducao")}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                      >
                        Prev. Produção
                        <Info className="h-3 w-3" />
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover">
                      <p>Prev. Vendas - Estoque = Quanto precisa produzir</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-right">Realizado</TableHead>
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
                  <TableCell className="font-medium max-w-[250px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block cursor-default">{row.produto}</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover max-w-[400px]">
                          <p>{row.produto}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.codigo}</TableCell>
                  <TableCell>{row.cliente}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      row.isOperational && "text-primary font-bold",
                      row.previsaoOrigem === 'sem_dados' && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {row.previsaoExplicacao && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className={cn(
                                "h-3 w-3 cursor-help",
                                row.previsaoOrigem === 'sem_dados' ? "text-warning" : "text-muted-foreground"
                              )} />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover max-w-[300px]">
                              <p className="text-sm">{row.previsaoExplicacao}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span>{row.previsaoVendas > 0 ? formatNumber(row.previsaoVendas) : "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.estoque > 0 ? formatNumber(row.estoque) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold min-w-[100px]",
                      !row.isPrevisaoProducaoManual && row.previsaoProducao <= 0 && "text-success",
                      row.previsaoProducao > 0 && "text-warning",
                      row.isPrevisaoProducaoManual && "text-primary"
                    )}
                  >
                    {editandoProducaoCodigo === row.codigo ? (
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          value={editandoProducaoValor}
                          onChange={(e) => setEditandoProducaoValor(e.target.value)}
                          placeholder="0 = remover"
                          className="w-24 px-2 py-1 text-sm border border-border rounded text-right bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSalvarProducao(row.codigo);
                            if (e.key === "Escape") handleCancelarEdicaoProducao();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-success hover:text-success"
                          onClick={() => handleSalvarProducao(row.codigo)}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={handleCancelarEdicaoProducao}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        {row.isPrevisaoProducaoManual && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 cursor-help text-primary" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-popover">
                                <p className="text-sm">
                                  Valor manual. Calculado seria: {row.previsaoProducaoCalculada <= 0 
                                    ? "Estoque suficiente" 
                                    : formatNumber(row.previsaoProducaoCalculada)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {row.previsaoVendas > 0 || row.estoque > 0 || row.isPrevisaoProducaoManual ? (
                          <button
                            onClick={() => handleIniciarEdicaoProducao(row.codigo, row.previsaoProducao)}
                            className="hover:underline cursor-pointer transition-colors whitespace-nowrap"
                          >
                            {row.previsaoProducao <= 0 && !row.isPrevisaoProducaoManual ? (
                              <span className="text-xs whitespace-nowrap">Estoque suficiente</span>
                            ) : (
                              formatNumber(row.previsaoProducao)
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleIniciarEdicaoProducao(row.codigo, 0)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            —
                          </button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.isPast ? formatNumber(row.realizado) : "—"}
                  </TableCell>
                   <TableCell className="text-right">
                    {editandoCodigo === row.codigo ? (
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          step="0.1"
                          value={editandoValor}
                          onChange={(e) => setEditandoValor(e.target.value)}
                          placeholder="0 = remover"
                          className="w-24 px-2 py-1 text-sm border border-border rounded text-right bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSalvarCrescimento(row.codigo);
                            if (e.key === "Escape") handleCancelarEdicao();
                          }}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-success hover:text-success"
                          onClick={() => handleSalvarCrescimento(row.codigo)}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={handleCancelarEdicao}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleIniciarEdicao(row.codigo, row.crescimento)}
                          className="text-sm font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
                        >
                          {row.crescimento}%
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {mesSelecionado ? `(mês ${mesSelecionado})` : "(todos)"}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MiniGraficoComparacao
                      previsao={row.previsaoVendas}
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
