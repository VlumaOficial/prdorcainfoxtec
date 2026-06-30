import { clamp99 } from './numeros'
import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import type { ConfigGlobal } from '../hooks/useConfigGlobal'

export interface ResultadoItem {
  custoTotal: number
  margemRS: number
  precoTabela: number
  descVal: number
  total: number
  comImposto: number
  lucro: number
  piso: number
}

// Calcula um item seguindo exatamente a regra do HTML original (calcItem).
export function calcularItem(item: ItemOrcamento, config: ConfigGlobal): ResultadoItem {
  const custoTotal = item.qtd * item.custoUnit
  const margPct = clamp99(item.usaMargGlobal ? config.margPct : item.margPct)
  const margemRS = custoTotal * (margPct / 100)
  const baseAntesImposto = custoTotal + margemRS
  const impPct = clamp99(item.usaImpGlobal ? config.impPct : item.impPct)
  const precoTabela = impPct > 0 ? baseAntesImposto / (1 - impPct / 100) : baseAntesImposto

  let descVal = 0
  const descPctEfetivo = item.usaDescGlobal ? config.descPct : item.descPct
  if (item.descFix > 0 && !item.usaDescGlobal) {
    descVal = Math.min(item.descFix, precoTabela)
  } else {
    descVal = precoTabela * (clamp99(descPctEfetivo) / 100)
  }

  const total = precoTabela - descVal
  const comImposto = total * (impPct / 100)
  const lucro = total - comImposto - custoTotal
  const piso = impPct < 100 ? custoTotal / (1 - impPct / 100) : custoTotal

  return { custoTotal, margemRS, precoTabela, descVal, total, comImposto, lucro, piso }
}

export interface ResultadoTotais {
  tCusto: number
  tMarg: number
  tDesc: number
  tImp: number
  tLuc: number
  tFinal: number
  tPiso: number
}

export function calcularTotais(itens: ItemOrcamento[], config: ConfigGlobal): ResultadoTotais {
  const acc: ResultadoTotais = { tCusto: 0, tMarg: 0, tDesc: 0, tImp: 0, tLuc: 0, tFinal: 0, tPiso: 0 }
  for (const item of itens) {
    const r = calcularItem(item, config)
    acc.tCusto += r.custoTotal
    acc.tMarg += r.margemRS
    acc.tDesc += r.descVal
    acc.tImp += r.comImposto
    acc.tLuc += r.lucro
    acc.tFinal += r.total
    acc.tPiso += r.piso
  }
  return acc
}
