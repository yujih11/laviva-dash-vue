import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { getMonthName } from "@/lib/date-utils";

interface ActiveFiltersAlertProps {
  totalResults: number;
}

export function ActiveFiltersAlert({ totalResults }: ActiveFiltersAlertProps) {
  const { filters, resetFilters } = useDashboardFilters();
  
  const hasActiveFilters =
    filters.produtos.length > 0 ||
    filters.clientes.length > 0 ||
    filters.mes !== null ||
    filters.ano !== null;

  if (!hasActiveFilters) return null;

  const filterParts: string[] = [];
  
  if (filters.produtos.length > 0) {
    filterParts.push(`${filters.produtos.length} produto${filters.produtos.length > 1 ? "s" : ""}`);
  }
  
  if (filters.clientes.length > 0) {
    filterParts.push(`${filters.clientes.length} cliente${filters.clientes.length > 1 ? "s" : ""}`);
  }
  
  if (filters.mes && filters.ano) {
    const monthName = getMonthName(filters.mes);
    filterParts.push(`${monthName}/${filters.ano}`);
  } else if (filters.ano) {
    filterParts.push(filters.ano);
  }

  return (
    <Alert className="border-blue-500/50 bg-blue-500/10">
      <Search className="h-4 w-4 text-blue-500" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-blue-500">
            🔍 Filtrando por:
          </span>
          {filterParts.map((part, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {part}
            </Badge>
          ))}
          <span className="text-sm text-muted-foreground">
            • {totalResults} resultado{totalResults !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 gap-1 text-xs"
        >
          <X className="h-3 w-3" />
          Limpar filtros
        </Button>
      </AlertDescription>
    </Alert>
  );
}
