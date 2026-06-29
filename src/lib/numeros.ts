/**
 * Faz parse de um numero em string aceitando formato BR ou US.
 * Exemplos:
 *   "1,50"       -> 1.5
 *   "1.50"       -> 1.5
 *   "1.234,50"   -> 1234.5
 *   "1234.50"    -> 1234.5
 *   "1.234"      -> 1234   (sem vírgula, ponto interpretado como milhar)
 *   ""           -> 0
 */
export function parseBR(valor: string): number {
  if (!valor) return 0
  const s = valor.trim()
  if (!s) return 0

  const temVirgula = s.includes(',')

  if (temVirgula) {
    // Formato BR: pontos sao milhares, virgula e decimal
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  }

  // Sem virgula: pode ser US (1.50) ou BR sem decimal (1.234)
  const partes = s.split('.')
  if (partes.length === 2 && partes[1].length <= 2) {
    // Provavelmente decimal US: 1.5 ou 1.50
    return parseFloat(s) || 0
  }

  // Tem multiplos pontos ou grupo de 3 digitos: separadores de milhar
  return parseFloat(s.replace(/\./g, '')) || 0
}
