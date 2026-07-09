import { useState } from 'react'

export interface ConfigGlobal {
  impPct: number
  margPct: number
  descPct: number
  impNoPdf: boolean
  descNoPdf: boolean
  qtdPdf: boolean
  valorUnitPdf: boolean
  totalLinhaPdf: boolean
}

export function useConfigGlobal() {
  const [config, setConfig] = useState<ConfigGlobal>({
    impPct: 0,
    margPct: 0,
    descPct: 0,
    impNoPdf: false,
    descNoPdf: false,
    qtdPdf: false,
    valorUnitPdf: false,
    totalLinhaPdf: false,
  })

  function atualizar<K extends keyof ConfigGlobal>(campo: K, valor: ConfigGlobal[K]) {
    setConfig((prev) => ({ ...prev, [campo]: valor }))
  }

  function carregar(novaConfig: ConfigGlobal) {
    setConfig(novaConfig)
  }

  function resetar() {
    setConfig({ impPct: 0, margPct: 0, descPct: 0, impNoPdf: false, descNoPdf: false, qtdPdf: false, valorUnitPdf: false, totalLinhaPdf: false })
  }

  return { config, atualizar, carregar, resetar }
}
