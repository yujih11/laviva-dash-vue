import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseDashboardData } from "@/hooks/useSupabaseDashboardData";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package } from "lucide-react";
import { EstoqueResumido } from "@/hooks/useSupabaseDashboardData";
import { formatNumber } from "@/lib/format-utils";

export default function EstoqueResumidoPage() {
  const navigate = useNavigate();
  const { loadEstoqueResumido } = useSupabaseDashboardData();
  const { filters } = useDashboardFilters();
  const [loading, setLoading] = useState(true);
  const [estoque, setEstoque] = useState<EstoqueResumido[]>([]);

  useEffect(() => {
    loadData();
  }, [filters.produtos]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await loadEstoqueResumido();
      
      // Aplicar filtro de produtos se houver
      let filteredData = data;
      if (filters.produtos.length > 0) {
        filteredData = data.filter((item) =>
          filters.produtos.includes(item.codigo_produto || "")
        );
      }

      // Ordenar por estoque total decrescente
      filteredData.sort((a, b) => (b.estoque_total || 0) - (a.estoque_total || 0));
      
      setEstoque(filteredData);
    } catch (error) {
      console.error("Erro ao carregar estoque resumido:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque Resumido
            </CardTitle>
            <CardDescription>
              Visão consolidada do estoque por produto (sem detalhamento de lotes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : estoque.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum produto em estoque encontrado
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Produto</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead className="text-right">Estoque Total</TableHead>
                        <TableHead className="text-right">Estoque Disponível</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estoque.map((item, index) => (
                        <TableRow key={`${item.codigo_produto}-${index}`}>
                          <TableCell className="font-medium max-w-[250px] truncate">
                            {item.produto || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.codigo_produto || "—"}
                          </TableCell>
                          <TableCell>{item.marca || "—"}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatNumber(item.estoque_total || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(item.estoque_disponivel || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
