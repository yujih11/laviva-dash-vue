import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseDashboardData } from "@/hooks/useSupabaseDashboardData";
import { useFilteredDashboardData } from "@/hooks/useFilteredDashboardData";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { cleanProductName } from "@/lib/product-utils";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AlertasAgrupados } from "@/components/dashboard/AlertasAgrupados";
import { EstoqueTable } from "@/components/dashboard/EstoqueTable";
import { TabelaPrevisaoProdutos } from "@/components/dashboard/TabelaPrevisaoProdutos";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { EstoqueTotalModal } from "@/components/dashboard/EstoqueTotalModal";
import { ViewingContextAlert } from "@/components/dashboard/ViewingContextAlert";
import { ActiveFiltersAlert } from "@/components/dashboard/ActiveFiltersAlert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  Package,
  TrendingUp,
  Calendar,
  AlertTriangle,
  BarChart3,
  Table as TableIcon,
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { dashboardData, estoqueAtual, loading, error, refetch, loadEstoqueResumido } = useSupabaseDashboardData();
  const { filteredDashboard, filteredEstoque } = useFilteredDashboardData(dashboardData, estoqueAtual);
  const [isEstoqueTotalModalOpen, setIsEstoqueTotalModalOpen] = useState(false);

  if (error) {
    toast.error("Erro ao carregar dados", {
      description: "Não foi possível carregar os dados do dashboard.",
    });
  }

  // Agregar dados para estatísticas (usando dados filtrados)
  // 1. Produtos Monitorados - contar produtos únicos (com nomes limpos)
  const totalProdutos = new Set(
    filteredDashboard.map((item) => cleanProductName(item.produto)).filter(Boolean)
  ).size;

  // 2. Estoque Total - somar quantidade_total e calcular percentual disponível
  const totalEstoque = filteredEstoque.reduce((acc, item) => acc + (item.quantidade_total || 0), 0);
  const estoqueDisponivel = filteredEstoque.reduce(
    (acc, item) => acc + (item.quantidade_disponivel || 0),
    0
  );
  const percentualEstoqueDisponivel = totalEstoque > 0 ? (estoqueDisponivel / totalEstoque) * 100 : 0;

  // 3. Previsão 2025 - calcular baseado no mês selecionado (se houver) ou soma total
  const { filters } = useDashboardFilters();
  const mesMap: Record<string, number> = {
    'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
  };
  
  const previsao2025Total = filteredDashboard.reduce((acc, item) => {
    if (!item.previsoes) return acc;

    // Se há mês selecionado, somar apenas esse mês
    if (filters.mes !== null) {
      const previsaoMes = item.previsoes.find((p) => {
        const mesStr = String(p.mes).toLowerCase();
        const mesNum = mesMap[mesStr] || parseInt(String(p.mes));
        const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
        return mesNum === filters.mes && anoNum === 2025;
      });
      return acc + Number(previsaoMes?.total_previsto ?? 0);
    }

    // Caso contrário, somar todos os meses de 2025
    const total2025 = item.previsoes
      .filter((p) => {
        const anoNum = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
        return anoNum === 2025;
      })
      .reduce((sum, p) => sum + Number(p.total_previsto ?? 0), 0);
    
    return acc + total2025;
  }, 0);

  // 4. Alertas - contar total de alertas
  const totalAlertas = filteredDashboard.reduce((acc, item) => {
    const alertas = item.alertas;
    if (Array.isArray(alertas)) {
      return acc + alertas.length;
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader onRefresh={() => refetch()} loading={loading} />

      {/* Barra de Filtros */}
      <FilterBar data={dashboardData} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Produtos Monitorados"
                value={totalProdutos}
                description="Total de produtos únicos"
                icon={Package}
                variant="default"
              />
              <StatsCard
                title="Estoque Total"
                value={totalEstoque.toLocaleString("pt-BR")}
                description={`${estoqueDisponivel.toLocaleString("pt-BR")} disponível (${percentualEstoqueDisponivel.toFixed(0)}%)`}
                icon={BarChart3}
                trend={percentualEstoqueDisponivel > 50 ? "up" : percentualEstoqueDisponivel > 20 ? "neutral" : "down"}
                trendValue={`${percentualEstoqueDisponivel.toFixed(1)}%`}
                variant={percentualEstoqueDisponivel > 50 ? "success" : percentualEstoqueDisponivel > 20 ? "warning" : "destructive"}
              />
              <StatsCard
                title={filters.mes ? `Previsão ${filters.ano || "2025"} - Mês ${filters.mes}` : "Previsão 2025 Total"}
                value={previsao2025Total.toLocaleString("pt-BR")}
                description={filters.mes ? "Unidades previstas no mês" : "Unidades previstas no ano"}
                icon={TrendingUp}
                variant="default"
              />
              <StatsCard
                title="Alertas"
                value={totalAlertas}
                description="Requerem atenção"
                icon={AlertTriangle}
                variant={totalAlertas > 0 ? "warning" : "success"}
              />
            </>
          )}
        </section>

        {/* Alertas e Notificações Agrupados */}
        <section>
          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <AlertasAgrupados data={filteredDashboard} />
          )}
        </section>

        {/* Tabela Principal de Previsões */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Previsão de Produção por Produto
              </CardTitle>
              <CardDescription>
                Detalhamento completo de previsões, realizações e alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso Inteligente de Contexto */}
              <ViewingContextAlert mes={filters.mes} ano={filters.ano === "2025" ? 2025 : filters.ano === "2026" ? 2026 : null} />
              
              {/* Alerta de Filtros Ativos */}
              <ActiveFiltersAlert totalResults={filteredDashboard.length} />
              
              {/* Mensagem quando não há resultados */}
              {filteredDashboard.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum resultado encontrado com os filtros atuais. Tente ajustar os filtros para ver mais dados.
                  </AlertDescription>
                </Alert>
              )}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <TabelaPrevisaoProdutos
                  data={filteredDashboard}
                  estoqueAtual={estoqueAtual}
                  mesSelecionado={filters.mes}
                  anoSelecionado={filters.ano}
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Estoque Section */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Estoque Atual
                  </CardTitle>
                  <CardDescription>Visualização dos itens em estoque</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/estoque-resumido")}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Ver Estoque Total
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <EstoqueTable estoque={filteredEstoque} />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Previsões Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Previsões de Produção
              </CardTitle>
              <CardDescription>Projeções para 2025 e 2026</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredDashboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma previsão disponível com os filtros selecionados
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDashboard.slice(0, 5).map((item) => (
                    <div
                      key={item.id || item.codigo_produto}
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{cleanProductName(item.produto)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.cliente || "—"} • {item.codigo_produto}
                          </p>
                        </div>
                        {item.crescimento_percentual && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Crescimento</p>
                            <p className="text-lg font-bold text-primary">
                              {item.crescimento_percentual.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1">Previsão 2025</p>
                          <p className="text-2xl font-bold text-foreground">
                            {(() => {
                              const total = item.previsoes
                                .filter((p) => p.ano === "2025")
                                .reduce((sum, p) => sum + Number(p.total_previsto ?? 0), 0);
                              return total.toLocaleString("pt-BR");
                            })()}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1">Previsão 2026</p>
                          <p className="text-2xl font-bold text-foreground">
                            {(() => {
                              const total = item.previsoes
                                .filter((p) => p.ano === "2026")
                                .reduce((sum, p) => sum + Number(p.total_previsto ?? 0), 0);
                              return total.toLocaleString("pt-BR");
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Modal Estoque Total */}
      <EstoqueTotalModal
        open={isEstoqueTotalModalOpen}
        onOpenChange={setIsEstoqueTotalModalOpen}
        loadEstoqueResumido={loadEstoqueResumido}
        filtros={{
          produtos: filters.produtos,
          clientes: filters.clientes,
        }}
      />
    </div>
  );
};

export default Index;
