import { useMemo } from "react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { DashboardData } from "@/hooks/useSupabaseDashboardData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  data: DashboardData[];
}

const meses = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function FilterBar({ data }: FilterBarProps) {
  const { filters, setFilters, resetFilters } = useDashboardFilters();

  // Extrair listas únicas de produtos e clientes
  const produtos = useMemo(() => {
    const uniqueProdutos = [...new Set(data.map((item) => item.produto).filter(Boolean))];
    return uniqueProdutos.sort();
  }, [data]);

  const clientes = useMemo(() => {
    const uniqueClientes = [...new Set(data.map((item) => item.cliente).filter(Boolean))];
    return uniqueClientes.sort();
  }, [data]);

  // Verificar se há filtros ativos
  const hasActiveFilters =
    filters.produtos.length > 0 ||
    filters.clientes.length > 0 ||
    filters.ano !== null ||
    filters.mes !== null;

  const activeFilterCount =
    filters.produtos.length +
    filters.clientes.length +
    (filters.ano ? 1 : 0) +
    (filters.mes ? 1 : 0);

  return (
    <div className="border-b border-border bg-card/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Header dos Filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Filtros</h2>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 gap-1 text-xs"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Grid de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filtro de Produtos */}
            <MultiSelectFilter
              label="Produtos"
              options={produtos}
              selected={filters.produtos}
              onSelect={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  produtos: prev.produtos.includes(value)
                    ? prev.produtos.filter((p) => p !== value)
                    : [...prev.produtos, value],
                }))
              }
              placeholder="Selecione produtos"
            />

            {/* Filtro de Clientes */}
            <MultiSelectFilter
              label="Clientes"
              options={clientes}
              selected={filters.clientes}
              onSelect={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  clientes: prev.clientes.includes(value)
                    ? prev.clientes.filter((c) => c !== value)
                    : [...prev.clientes, value],
                }))
              }
              placeholder="Selecione clientes"
            />

            {/* Filtro de Ano */}
            <Select
              value={filters.ano || ""}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  ano: value ? (value as "2025" | "2026") : null,
                }))
              }
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Mês */}
            <Select
              value={filters.mes?.toString() || ""}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  mes: value ? parseInt(value) : null,
                }))
              }
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-[300px]">
                {meses.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para multi-select
interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  placeholder: string;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onSelect,
  placeholder,
}: MultiSelectFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start bg-background hover:bg-muted/50"
        >
          <span className="truncate">
            {selected.length > 0
              ? `${selected.length} ${label.toLowerCase()} selecionado${selected.length > 1 ? "s" : ""}`
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
        <Command className="bg-popover">
          <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => onSelect(option)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
