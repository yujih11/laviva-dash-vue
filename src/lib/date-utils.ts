/**
 * Obtém o trimestre baseado no mês (1-12)
 */
export function getQuarter(mes: number): "Q1" | "Q2" | "Q3" | "Q4" {
  if (mes >= 1 && mes <= 3) return "Q1";
  if (mes >= 4 && mes <= 6) return "Q2";
  if (mes >= 7 && mes <= 9) return "Q3";
  return "Q4";
}

/**
 * Verifica se o mês/ano é no passado
 */
export function isMonthInPast(mes: number, ano: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-11 -> 1-12

  if (ano < currentYear) return true;
  if (ano === currentYear && mes < currentMonth) return true;
  return false;
}

/**
 * Verifica se o mês/ano é no futuro
 */
export function isMonthInFuture(mes: number, ano: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (ano > currentYear) return true;
  if (ano === currentYear && mes > currentMonth) return true;
  return false;
}

/**
 * Verifica se o mês está dentro de 2 meses do atual (para destaque operacional)
 */
export function isWithinTwoMonths(mes: number, ano: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (ano === currentYear && mes >= currentMonth && mes <= currentMonth + 2) {
    return true;
  }

  // Caso especial: final do ano
  if (ano === currentYear + 1 && currentMonth >= 11) {
    return mes <= (currentMonth + 2) - 12;
  }

  return false;
}

/**
 * Obtém o mês anterior
 */
export function getPreviousMonth(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) {
    return { mes: 12, ano: ano - 1 };
  }
  return { mes: mes - 1, ano };
}

/**
 * Formata o nome do mês
 */
export function getMonthName(mes: number): string {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return meses[mes - 1] || "";
}
