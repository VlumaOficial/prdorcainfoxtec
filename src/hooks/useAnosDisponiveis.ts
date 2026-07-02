import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Retorna os anos que tem orcamentos (do banco) + o ano corrente, ordenados desc.
export function useAnosDisponiveis(): number[] {
  const [anos, setAnos] = useState<number[]>([new Date().getFullYear()])

  useEffect(() => {
    let ativo = true
    async function buscar() {
      const { data, error } = await supabase.rpc('anos_com_orcamentos')
      if (!ativo) return

      const anoAtual = new Date().getFullYear()
      const set = new Set<number>([anoAtual])
      if (!error && data) {
        for (const row of data as { ano: number }[]) {
          if (row.ano) set.add(Number(row.ano))
        }
      }
      const lista = Array.from(set).sort((a, b) => b - a)
      setAnos(lista)
    }
    buscar()
    return () => { ativo = false }
  }, [])

  return anos
}
