import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { DashboardData } from "@/hooks/useSupabaseDashboardData";
import { cleanProductName } from "@/lib/product-utils";
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
import { Check, X, Filter, Calendar, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
  const navigate = useNavigate();
  const { filters, setFilters, resetFilters } = useDashboardFilters();

  // Extrair listas únicas de produtos (por codigo_produto)
  const produtos = useMemo(() => {
    const produtosMap = new Map<string, string>();
    data.forEach((item) => {
      if (item.codigo_produto && item.produto) {
        produtosMap.set(item.codigo_produto, cleanProductName(item.produto));
      }
    });
    return Array.from(produtosMap.entries())
      .map(([codigo, nome]) => ({ codigo, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data]);

  // Extrair lista única de clientes (separar strings concatenadas)
  const clientes = useMemo(() => {
    const clientesSet = new Set<string>();
    data.forEach((item) => {
      if (item.cliente) {
        item.cliente.split(",").forEach(c => clientesSet.add(c.trim()));
      }
    });
    return Array.from(clientesSet).filter(Boolean).sort();
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Produtos */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground font-medium">
                <Package className="h-3.5 w-3.5 opacity-70" />
                Produtos
              </Label>
              <MultiSelectFilterProdutos
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
            </div>

            {/* Filtro de Clientes */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground font-medium">
                <Users className="h-3.5 w-3.5 opacity-70" />
                Clientes
              </Label>
              <MultiSelectFilter
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
            </div>

            {/* Filtro de Ano */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground font-medium">
                <Calendar className="h-3.5 w-3.5 opacity-70" />
                Ano
              </Label>
              <Select
                value={filters.ano || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    ano: value ? (value as "2025" | "2026") : null,
                  }))
                }
              >
                <SelectTrigger className="bg-background text-foreground placeholder:text-muted-foreground/80">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Mês */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground font-medium">
                <Calendar className="h-3.5 w-3.5 opacity-70" />
                Mês
              </Label>
              <Select
                value={filters.mes?.toString() || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    mes: value ? parseInt(value) : null,
                  }))
                }
              >
                <SelectTrigger className="bg-background text-foreground placeholder:text-muted-foreground/80">
                  <SelectValue placeholder="Selecione o mês" />
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

          {/* Botão Ver Detalhes quando um produto está selecionado */}
          {filters.produtos.length === 1 && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => navigate(`/produto-detalhes/${filters.produtos[0]}`)}
                variant="default"
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Ver Detalhes do Produto
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para multi-select de produtos (com codigo e nome)
interface MultiSelectFilterProdutosProps {
  options: Array<{ codigo: string; nome: string }>;
  selected: string[];
  onSelect: (value: string) => void;
  placeholder: string;
}

function MultiSelectFilterProdutos({
  options,
  selected,
  onSelect,
  placeholder,
}: MultiSelectFilterProdutosProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start bg-background hover:bg-muted/50 text-foreground placeholder:text-muted-foreground/80"
        >
          <span className="truncate text-muted-foreground/80">
            {selected.length > 0
              ? `${selected.length} item${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}`
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 bg-popover" align="start">
        <Command className="bg-popover">
          <CommandInput placeholder="Buscar produto..." className="text-foreground placeholder:text-muted-foreground/80" />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.codigo}
                  value={option.nome}
                  onSelect={() => onSelect(option.codigo)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option.codigo)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate">{option.nome}</span>
                    <span className="text-xs text-muted-foreground">{option.codigo}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Componente auxiliar para multi-select genérico
interface MultiSelectFilterProps {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  placeholder: string;
}

function MultiSelectFilter({
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
          className="w-full justify-start bg-background hover:bg-muted/50 text-foreground placeholder:text-muted-foreground/80"
        >
          <span className="truncate text-muted-foreground/80">
            {selected.length > 0
              ? `${selected.length} item${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}`
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
        <Command className="bg-popover">
          <CommandInput placeholder="Buscar..." className="text-foreground placeholder:text-muted-foreground/80" />
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
