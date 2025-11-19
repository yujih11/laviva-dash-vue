import { useSupabaseDashboardData } from "@/hooks/useSupabaseDashboardData";
import { useFilteredDashboardData } from "@/hooks/useFilteredDashboardData";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { EstoqueTable } from "@/components/dashboard/EstoqueTable";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  Calendar,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { dashboardData, estoqueAtual, loading, error, refetch } = useSupabaseDashboardData();
  const { filteredDashboard, filteredEstoque } = useFilteredDashboardData(dashboardData, estoqueAtual);

  if (error) {
    toast.error("Erro ao carregar dados", {
      description: "Não foi possível carregar os dados do dashboard.",
    });
  }

  // Agregar dados para estatísticas (usando dados filtrados)
  // 1. Produtos Monitorados - contar produtos únicos
  const totalProdutos = new Set(filteredDashboard.map((item) => item.produto).filter(Boolean)).size;

  // 2. Estoque Total - somar quantidade_total e calcular percentual disponível
  const totalEstoque = filteredEstoque.reduce((acc, item) => acc + (item.quantidade_total || 0), 0);
  const estoqueDisponivel = filteredEstoque.reduce(
    (acc, item) => acc + (item.quantidade_disponivel || 0),
    0
  );
  const percentualEstoqueDisponivel = totalEstoque > 0 ? (estoqueDisponivel / totalEstoque) * 100 : 0;

  // 3. Previsão 2025 - calcular baseado no mês selecionado (se houver) ou soma total
  const { filters } = useDashboardFilters();
  const previsao2025Total = filteredDashboard.reduce((acc, item) => {
    const previsoes = item.previsao_2025_parsed || [];
    
    if (!Array.isArray(previsoes)) return acc;

    // Se há mês selecionado, somar apenas esse mês
    if (filters.mes !== null) {
      const mesData = previsoes.find((p) => p.mes === filters.mes);
      return acc + (mesData?.quantidade || 0);
    }

    // Caso contrário, somar todos os meses
    return acc + previsoes.reduce((sum, p) => sum + (p.quantidade || 0), 0);
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

        {/* Alertas Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas e Notificações
              </CardTitle>
              <CardDescription>Itens que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <AlertsList
                  alerts={filteredDashboard.flatMap((item) => item.alertas || [])}
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Estoque Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Estoque Atual
              </CardTitle>
              <CardDescription>Visualização dos itens em estoque</CardDescription>
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
                      key={item.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{item.produto}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.cliente} • {item.codigo_produto}
                          </p>
                        </div>
                        {item.crescimento_manual && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Crescimento</p>
                            <p className="text-lg font-bold text-primary">
                              {(item.crescimento_manual * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1">Previsão 2025</p>
                          <p className="text-2xl font-bold text-foreground">
                            {(Array.isArray(item.previsao_2025_parsed)
                              ? item.previsao_2025_parsed.reduce((sum, p) => sum + (p.quantidade || 0), 0)
                              : 0
                            ).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1">Previsão 2026</p>
                          <p className="text-2xl font-bold text-foreground">
                            {(Array.isArray(item.previsao_2026_parsed)
                              ? item.previsao_2026_parsed.reduce((sum, p) => sum + (p.quantidade || 0), 0)
                              : 0
                            ).toLocaleString("pt-BR")}
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
    </div>
  );
};

export default Index;
