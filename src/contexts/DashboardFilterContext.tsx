import React, { createContext, useContext, useState, ReactNode } from "react";

export interface DashboardFilters {
  produtos: string[];
  clientes: string[];
  ano: "2025" | "2026" | null;
  mes: number | null;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  resetFilters: () => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

// Calcula data atual + 2 meses para filtros iniciais
function getInitialDateFilters(): { ano: "2025" | "2026" | null; mes: number | null } {
  const dataAtual = new Date();
  const dataFutura = new Date();
  dataFutura.setMonth(dataAtual.getMonth() + 2);
  
  const mesInicial = dataFutura.getMonth() + 1; // 1-12
  const anoInicial = dataFutura.getFullYear();
  
  // Apenas definir ano se for 2025 ou 2026
  const ano = anoInicial === 2025 || anoInicial === 2026 ? String(anoInicial) as "2025" | "2026" : null;
  
  return {
    ano,
    mes: mesInicial,
  };
}

const { ano: anoInicial, mes: mesInicial } = getInitialDateFilters();

const initialFilters: DashboardFilters = {
  produtos: [],
  clientes: [],
  ano: anoInicial,
  mes: mesInicial,
};

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <DashboardFilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error("useDashboardFilters must be used within a DashboardFilterProvider");
  }
  return context;
}
