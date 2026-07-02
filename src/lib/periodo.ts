// Periodo de filtragem do dashboard.
// Se 'tudo' for true, ignora mes/ano e considera todos os registros.
export interface Periodo {
  mes: number // 1-12
  ano: number
  tudo: boolean
}

// Retorna o periodo padrao: mes e ano correntes.
export function periodoPadrao(): Periodo {
  const d = new Date()
  return { mes: d.getMonth() + 1, ano: d.getFullYear(), tudo: false }
}

// Retorna as datas de inicio (inclusive) e fim (exclusive) do periodo, em 'YYYY-MM-DD'.
// Para 'tudo', retorna null (sem limites).
export function limitesDoPeriodo(p: Periodo): { inicio: string; fim: string } | null {
  if (p.tudo) return null
  const mesStr = String(p.mes).padStart(2, '0')
  const inicio = `${p.ano}-${mesStr}-01`
  // Primeiro dia do mes seguinte (fim exclusivo)
  const proxMes = p.mes === 12 ? 1 : p.mes + 1
  const proxAno = p.mes === 12 ? p.ano + 1 : p.ano
  const fim = `${proxAno}-${String(proxMes).padStart(2, '0')}-01`
  return { inicio, fim }
}

export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
