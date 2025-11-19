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

const initialFilters: DashboardFilters = {
  produtos: [],
  clientes: [],
  ano: null,
  mes: null,
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
