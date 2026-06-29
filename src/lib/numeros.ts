/**
 * parseBR - identico ao HTML original (infoxtec-orcamento.html linhas 354-361)
 * Aceita tanto formato BR (1.500,00) quanto numero simples (1500.00)
 * Regra: se tem virgula, e BR; senao, parseFloat direto.
 */
export function parseBR(v: string | number | null | undefined): number {
  if (v === '' || v === null || v === undefined) return 0
  const s = v.toString().trim()
  if (s.includes(',')) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  }
  return parseFloat(s) || 0
}

/**
 * Formata numero como moeda BR: "1.500,00" (sem R$ na frente)
 */
export function fmtBR(v: number): string {
  return Math.abs(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * clamp99 - identico ao HTML original
 * Limita um percentual entre 0 e 99
 */
export function clamp99(v: number): number {
  if (!v || isNaN(v)) return 0
  if (v < 0) return 0
  if (v > 99) return 99
  return v
}
