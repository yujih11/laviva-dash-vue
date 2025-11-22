/**
 * Formata números com separador de milhar brasileiro
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return "—";
  }
  
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata data no padrão brasileiro (dd/mm/yyyy)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "—";
  
  return dateObj.toLocaleDateString("pt-BR");
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Remove valores null/undefined de strings
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || text === "null" || text === "undefined") {
    return "—";
  }
  return text;
}

/**
 * Retorna cor baseada em variação percentual
 */
export function getVariationColor(value: number | null | undefined): {
  text: string;
  bg: string;
} {
  if (value === null || value === undefined || isNaN(value)) {
    return { text: "text-muted-foreground", bg: "bg-muted/50" };
  }

  const absValue = Math.abs(value);
  
  if (absValue < 5) {
    return { text: "text-muted-foreground", bg: "bg-muted/50" };
  }
  
  if (absValue >= 20) {
    return value > 0 
      ? { text: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" }
      : { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
  }
  
  return value > 0
    ? { text: "text-green-600 dark:text-green-500", bg: "bg-green-500/5" }
    : { text: "text-red-600 dark:text-red-500", bg: "bg-red-500/5" };
}
