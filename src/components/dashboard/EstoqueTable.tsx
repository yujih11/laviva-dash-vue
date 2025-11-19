import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EstoqueAtual } from "@/hooks/useSupabaseDashboardData";
import { cleanProductName } from "@/lib/product-utils";

interface EstoqueTableProps {
  estoque: EstoqueAtual[];
}

export function EstoqueTable({ estoque }: EstoqueTableProps) {
  const getStatusBadge = (disponivel: number | null, total: number | null) => {
    if (!disponivel || !total) return <Badge variant="secondary">N/A</Badge>;

    const percentage = (disponivel / total) * 100;

    if (percentage < 20) {
      return <Badge variant="destructive">Baixo</Badge>;
    } else if (percentage < 50) {
      return <Badge className="bg-warning text-warning-foreground">Médio</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">OK</Badge>;
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Código</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead className="text-right">Disponível</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estoque.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum item em estoque
              </TableCell>
            </TableRow>
          ) : (
            estoque.slice(0, 10).map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-sm">{item.codigo_produto}</TableCell>
                <TableCell className="font-medium">{cleanProductName(item.produto)}</TableCell>
                <TableCell>{item.marca || "-"}</TableCell>
                <TableCell>{item.lote || "-"}</TableCell>
                <TableCell className="text-right font-semibold">
                  {item.quantidade_disponivel?.toString() || "0"}
                </TableCell>
                <TableCell className="text-right">{item.quantidade_total?.toString() || "0"}</TableCell>
                <TableCell>{getStatusBadge(item.quantidade_disponivel, item.quantidade_total)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
