/**
 * Limpa o nome do produto removendo números flutuantes e dados extras
 * que aparecem após o nome principal do produto.
 * 
 * Exemplo:
 * "NOZES SEM CASCA RD LAVIVA 12X100G - 1,2KG 18 10,87 0.0 0,00 0,00 0,00"
 * → "NOZES SEM CASCA RD LAVIVA 12X100G - 1,2KG"
 * 
 * @param productName - Nome do produto a ser limpo
 * @returns Nome do produto limpo
 */
export function cleanProductName(productName: string | null | undefined): string {
  if (!productName) return "";

  // Primeiro, trim básico
  let cleaned = productName.trim();

  // Regex para identificar onde começam sequências de números separados por espaços/vírgulas/pontos
  // Procura por padrões como: "18 10,87" ou "0.0 0,00" ou múltiplos números com separadores
  // Mantém o nome até encontrar padrões numéricos repetitivos
  const numericSequencePattern = /\s+\d+[\s,\.]+\d+[\s,\.]+.*$/;
  
  // Remove a sequência numérica
  cleaned = cleaned.replace(numericSequencePattern, "");

  // Remove zeros repetidos no final (caso existam padrões como "0,00 0,00")
  const trailingZerosPattern = /(\s+0[,\.]\d+)+\s*$/;
  cleaned = cleaned.replace(trailingZerosPattern, "");

  // Remove espaços extras que podem ter sobrado
  cleaned = cleaned.trim();

  // Remove números isolados no final (como "18" sozinho)
  const trailingSingleNumber = /\s+\d+\s*$/;
  cleaned = cleaned.replace(trailingSingleNumber, "");

  return cleaned.trim();
}

/**
 * Extrai a marca do nome do produto se ela estiver presente
 * 
 * @param productName - Nome do produto
 * @returns Nome da marca encontrada ou null
 */
export function extractBrand(productName: string | null | undefined): string | null {
  if (!productName) return null;

  const cleaned = cleanProductName(productName);
  
  // Lista de marcas conhecidas (pode ser expandida)
  const knownBrands = ["LAVIVA", "RD", "PREMIUM"];
  
  for (const brand of knownBrands) {
    if (cleaned.toUpperCase().includes(brand)) {
      return brand;
    }
  }

  return null;
}
