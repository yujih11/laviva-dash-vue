import * as XLSX from "xlsx";

interface ExportData {
  [key: string]: any;
}

/**
 * Exporta dados para Excel
 */
export function exportToExcel(
  data: ExportData[],
  filename: string,
  sheetName: string = "Dados"
) {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet a partir dos dados
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar largura das colunas automaticamente
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws["!cols"] = colWidths;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Gerar arquivo e fazer download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Formata dados da tabela de previsão para exportação
 */
export function formatPrevisaoDataForExport(
  data: Array<{
    produto: string;
    codigo: string;
    cliente: string;
    previsao: number;
    realizado: number | null;
    estoque: number;
    variacao: number;
    alertas: string[];
  }>,
  mes: number | null,
  ano: number | null
) {
  return data.map((row) => ({
    "Produto": row.produto,
    "Código": row.codigo,
    "Cliente": row.cliente,
    "Previsão": row.previsao,
    "Realizado": row.realizado ?? "—",
    "Estoque Atual": row.estoque,
    "Variação Trimestral (%)": row.variacao !== 0 ? row.variacao : "—",
    "Alertas": row.alertas.length > 0 ? row.alertas.join("; ") : "Nenhum",
  }));
}
