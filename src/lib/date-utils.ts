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

  // Calcular diferença de meses
  const targetDate = new Date(ano, mes - 1);
  const currentDate = new Date(currentYear, currentMonth - 1);
  
  const monthsDiff = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                     (targetDate.getMonth() - currentDate.getMonth());
  
  return monthsDiff === 2;
}

/**
 * Verifica se é o mês atual
 */
export function isCurrentMonth(mes: number, ano: number): boolean {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  return mes === currentMonth && ano === currentYear;
}

/**
 * Obtém o contexto de visualização baseado no mês/ano selecionado
 */
export function getViewingContext(mes: number | null, ano: number | null): {
  type: 'past' | 'current' | 'future' | 'focus' | 'all';
  message: string;
  icon: string;
  variant: 'default' | 'success' | 'warning' | 'destructive';
} {
  if (!mes || !ano) {
    return {
      type: 'all',
      message: 'Visualizando todos os períodos disponíveis',
      icon: '📊',
      variant: 'default',
    };
  }

  if (isWithinTwoMonths(mes, ano)) {
    const monthName = getMonthName(mes);
    return {
      type: 'focus',
      message: `${monthName}/${ano} é foco atual de produção`,
      icon: '🚨',
      variant: 'warning',
    };
  }

  if (isCurrentMonth(mes, ano)) {
    return {
      type: 'current',
      message: 'Visualizando mês atual — dados em tempo real',
      icon: '🔵',
      variant: 'default',
    };
  }

  if (isMonthInPast(mes, ano)) {
    return {
      type: 'past',
      message: 'Visualizando dados passados com comparativo real',
      icon: '🟢',
      variant: 'success',
    };
  }

  return {
    type: 'future',
    message: 'Visualizando previsão futura de produção',
    icon: '🔵',
    variant: 'default',
  };
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
