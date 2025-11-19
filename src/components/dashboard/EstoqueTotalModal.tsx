import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, X } from "lucide-react";
import { EstoqueResumido } from "@/hooks/useSupabaseDashboardData";
import { cleanProductName } from "@/lib/product-utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EstoqueTotalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadEstoqueResumido: () => Promise<EstoqueResumido[]>;
  filtros?: {
    produtos: string[];
    clientes: string[];
  };
}

export function EstoqueTotalModal({
  open,
  onOpenChange,
  loadEstoqueResumido,
  filtros,
}: EstoqueTotalModalProps) {
  const [estoque, setEstoque] = useState<EstoqueResumido[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await loadEstoqueResumido();
      
      // Aplicar filtros se ativos
      let filteredData = data;
      
      if (filtros?.produtos && filtros.produtos.length > 0) {
        filteredData = filteredData.filter((item) => {
          const cleanedName = cleanProductName(item.produto || "");
          return filtros.produtos.some((p) => 
            cleanedName.toLowerCase().includes(p.toLowerCase())
          );
        });
      }

      // Ordenar por estoque total decrescente
      filteredData.sort((a, b) => (b.estoque_total || 0) - (a.estoque_total || 0));
      
      setEstoque(filteredData);
    } catch (error) {
      console.error("Erro ao carregar estoque resumido:", error);
      setEstoque([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Estoque Total por Produto
          </DialogTitle>
          <DialogDescription>
            Visualização consolidada de estoque agregado
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : estoque.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">
                Nenhum dado disponível no momento para o estoque consolidado.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Estoque Total</TableHead>
                    <TableHead className="text-right">Estoque Disponível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoque.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {cleanProductName(item.produto || "—")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.codigo_produto || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.marca || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.estoque_total
                          ? item.estoque_total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.estoque_disponivel
                          ? item.estoque_disponivel.toLocaleString("pt-BR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
