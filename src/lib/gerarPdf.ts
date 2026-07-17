import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calcularItem } from './calculo'
import { fmtBR } from './numeros'
import type { CabecalhoOrcamento, DadosCliente } from '../hooks/useNovoOrcamento'
import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import type { ConfigGlobal } from '../hooks/useConfigGlobal'

interface DadosPdf {
  cabecalho: CabecalhoOrcamento
  cliente: DadosCliente
  itens: ItemOrcamento[]
  config: ConfigGlobal
  logoBase64?: string
}

function fmtData(iso: string): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

// A v5 do autotable expoe lastAutoTable em runtime, mas o tipo do jsPDF nao declara.
type DocComAutoTable = jsPDF & { lastAutoTable?: { finalY: number } }

// Dimensoes da pagina A4 (mm) e areas reservadas.
const PAGE_W = 210
const PAGE_H = 297
const MG = 15
const RODAPE_H = 16 // altura da faixa de rodape
const MARGEM_INFERIOR = RODAPE_H + 4 // area que a tabela nunca invade

const NAVY: [number, number, number] = [13, 27, 46]
const GREEN: [number, number, number] = [29, 185, 84]
const BLUE: [number, number, number] = [45, 142, 245]
const CINZA: [number, number, number] = [90, 100, 115]
const CINZA_CL: [number, number, number] = [200, 210, 225]

export function gerarPdf(dados: DadosPdf) {
  const { cabecalho, cliente, itens, config, logoBase64 } = dados

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Toggles de colunas opcionais do PDF.
  const showI = config.impNoPdf
  const showD = config.descNoPdf
  const showQtd = config.qtdPdf
  const showValorUnit = config.valorUnitPdf
  const showTotalLinha = config.totalLinhaPdf

  const contatoLinha = [cabecalho.telefoneContato, cabecalho.emailContato].filter(Boolean).join('  .  ')

  // ── Monta os dados da tabela (uma vez; reaproveitado no auto-fit) ──
  let tFinal = 0
  let tDescPDF = 0
  let tImpPDF = 0
  const rows: (string | number)[][] = []

  for (const item of itens) {
    if (item.custoUnit === 0) continue
    const r = calcularItem(item, config)
    tFinal += r.total
    tDescPDF += r.descVal
    tImpPDF += r.comImposto
    const valorUnitario = item.qtd > 0 ? r.total / item.qtd : r.total
    const linha: (string | number)[] = [rows.length + 1, item.descricao || '--']
    if (showQtd) linha.push(item.qtd.toLocaleString('pt-BR'))
    if (showValorUnit) linha.push(fmtBR(valorUnitario))
    if (showTotalLinha) linha.push(fmtBR(r.total))
    rows.push(linha)
  }

  const head: string[] = ['#', 'Descrição']
  if (showQtd) head.push('Qtd')
  if (showValorUnit) head.push('Valor Unit.')
  if (showTotalLinha) head.push('Total')

  // columnStyles dinamico conforme colunas ativas.
  function montarColumnStyles(): Record<number, Record<string, unknown>> {
    const cs: Record<number, Record<string, unknown>> = {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
    }
    let idx = 2
    if (showQtd) {
      cs[idx] = { halign: 'center', cellWidth: 16 }
      idx++
    }
    if (showValorUnit) {
      cs[idx] = { halign: 'right', cellWidth: 32 }
      idx++
    }
    if (showTotalLinha) {
      cs[idx] = { halign: 'right', cellWidth: 32, fontStyle: 'bold' }
      idx++
    }
    return cs
  }

  // ── Desenha o cabecalho visual (logo, titulo, emitente/cliente). Retorna o Y final. ──
  function desenharCabecalho(): number {
    let y = 15
    // Faixa header
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, PAGE_W, 44, 'F')
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', MG, 11, 52, 22)
      } catch {
        // ignora
      }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...GREEN)
    doc.text('ORÇAMENTO', PAGE_W - MG, 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...CINZA_CL)
    if (cabecalho.numero) doc.text(cabecalho.numero, PAGE_W - MG, 25, { align: 'right' })
    if (contatoLinha) doc.text(contatoLinha, PAGE_W - MG, 33, { align: 'right' })
    y = 52

    // Titulo + datas
    if (cabecalho.titulo) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...NAVY)
      const titLines = doc.splitTextToSize(cabecalho.titulo, PAGE_W - MG * 2)
      doc.text(titLines, MG, y)
      y += titLines.length * 6 + 2
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...CINZA)
    const dE = fmtData(cabecalho.dataEmissao)
    const dV = fmtData(cabecalho.validade)
    const infoLinha = [dE ? 'Emitido em ' + dE : '', dV ? 'Válido até ' + dV : ''].filter(Boolean).join('    ')
    if (infoLinha) {
      doc.text(infoLinha, MG, y)
      y += 8
    }
    doc.setDrawColor(...CINZA_CL)
    doc.setLineWidth(0.3)
    doc.line(MG, y, PAGE_W - MG, y)
    y += 7

    // Emitente | Cliente
    const cw = (PAGE_W - MG * 2 - 6) / 2
    doc.setFillColor(238, 244, 252)
    doc.roundedRect(MG, y, cw, 32, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BLUE)
    doc.text('EMITENTE', MG + 4, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...NAVY)
    doc.text('INFOXTEC TECNOLOGIA E SERVIÇOS LTDA', MG + 4, y + 11, { maxWidth: cw - 8 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...CINZA)
    doc.text('CNPJ: 04.309.223/0001-96', MG + 4, y + 18)
    doc.text('Rua Silveira Martins, 27, Cabula - 41150-000, Salvador/BA', MG + 4, y + 23, { maxWidth: cw - 8 })
    if (contatoLinha) doc.text(contatoLinha, MG + 4, y + 29, { maxWidth: cw - 8 })

    const cx = MG + cw + 6
    doc.setFillColor(238, 244, 252)
    doc.roundedRect(cx, y, cw, 32, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GREEN)
    doc.text('CLIENTE / TOMADOR', cx + 4, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...NAVY)
    doc.text(cliente.nome || '\u2014', cx + 4, y + 11, { maxWidth: cw - 8 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...CINZA)
    if (cliente.cnpj) doc.text('CNPJ: ' + cliente.cnpj, cx + 4, y + 18)
    if (cliente.endereco) doc.text(cliente.endereco, cx + 4, y + 23, { maxWidth: cw - 8 })
    const contatoCliente = cliente.responsavel || cliente.emailTelefone
    if (contatoCliente) doc.text('Resp: ' + contatoCliente, cx + 4, y + 29, { maxWidth: cw - 8 })
    y += 39

    return y
  }

  // ── Desenha o rodape de uma pagina (chamado via didDrawPage). ──
  function desenharRodape() {
    const yBase = PAGE_H - RODAPE_H
    doc.setFillColor(...NAVY)
    doc.rect(0, yBase, PAGE_W, RODAPE_H, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...CINZA_CL)
    // Linha 1: razao social + CNPJ
    doc.text('Infoxtec Tecnologia e Serviços Ltda  .  CNPJ 04.309.223/0001-96', MG, yBase + 6)
    // Linha 2: endereco
    doc.text('Rua Silveira Martins, 27, Cabula - 41150-000, Salvador/BA', MG, yBase + 11)
    // Site (direita, alinhado verticalmente ao centro do rodape)
    doc.setTextColor(...GREEN)
    doc.text('infoxtec.com.br', PAGE_W - MG, yBase + 8.5, { align: 'right' })
  }

  // ── Calcula a altura estimada do bloco de fechamento (resumo + total + obs). ──
  function alturaFechamento(fonteObs: number): number {
    let h = 0
    const bw = 90
    // resumo
    if (showD && tDescPDF > 0) h += 12
    if (showI && tImpPDF > 0) h += 6
    // box total
    h += 16
    // observacoes
    if (cabecalho.condicoesPagamento || cabecalho.observacoesGerais) {
      h += 8 // titulo + pagamento
      if (cabecalho.observacoesGerais) {
        doc.setFontSize(fonteObs)
        const linhas = doc.splitTextToSize(cabecalho.observacoesGerais, PAGE_W - MG * 2 - bw - 10)
        h += (Array.isArray(linhas) ? linhas.length : 1) * (fonteObs * 0.5)
      }
    }
    return h + 4
  }

  // ── Desenha o bloco de fechamento a partir de um Y. Retorna o Y final. ──
  function desenharFechamento(yInicio: number, fonteBase: number): number {
    let y = yInicio
    const bw = 90
    const bx = PAGE_W - MG - bw

    // Resumo (subtotal/desconto/impostos)
    const linhasResumo: string[][] = []
    if (showD && tDescPDF > 0) {
      linhasResumo.push(['Subtotal', fmtBR(tFinal + tDescPDF)])
      linhasResumo.push(['(-) Desconto', '- ' + fmtBR(tDescPDF)])
    }
    if (showI && tImpPDF > 0) {
      linhasResumo.push(['Impostos inclusos', fmtBR(tImpPDF)])
    }
    if (linhasResumo.length > 0) {
      autoTable(doc, {
        startY: y,
        body: linhasResumo,
        margin: { left: bx, right: MG },
        tableWidth: bw,
        bodyStyles: { fontSize: fonteBase },
        columnStyles: {
          0: { halign: 'left', textColor: CINZA },
          1: { halign: 'right', textColor: NAVY, fontStyle: 'bold' },
        },
        styles: { cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineColor: CINZA_CL, lineWidth: 0.1 },
      })
      y = ((doc as DocComAutoTable).lastAutoTable?.finalY || y) + 3
    }

    // Box TOTAL A PAGAR
    doc.setFillColor(...NAVY)
    doc.roundedRect(bx, y, bw, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL A PAGAR', bx + 4, y + 6)
    doc.setFontSize(13)
    doc.setTextColor(...GREEN)
    doc.text(fmtBR(tFinal), PAGE_W - MG - 3, y + 10, { align: 'right' })
    y += 20

    // Observacoes e Condicoes
    const oP = cabecalho.condicoesPagamento
    const oG = cabecalho.observacoesGerais
    if (oP || oG) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...NAVY)
      doc.text('Observações e Condições', MG, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fonteBase - 0.5)
      doc.setTextColor(...CINZA)
      if (oP) {
        const linhasP = doc.splitTextToSize('Pagamento: ' + oP, PAGE_W - MG * 2 - bw - 10)
        doc.text(linhasP, MG, y)
        y += (Array.isArray(linhasP) ? linhasP.length : 1) * 4 + 1
      }
      if (oG) {
        const linhas = doc.splitTextToSize(oG, PAGE_W - MG * 2 - bw - 10)
        doc.text(linhas, MG, y)
        y += (Array.isArray(linhas) ? linhas.length : 1) * 4
      }
    }
    return y
  }

  // ── AUTO-FIT: escolhe a fonte da tabela que melhor acomoda o conteudo. ──
  // Tenta caber tudo (tabela + fechamento) em 1 pagina, reduzindo a fonte por degraus.
  // Se nem na menor fonte couber, usa a menor e deixa o autoTable paginar (respeitando
  // a margem inferior, entao nunca sobrepoe o rodape).
  const fontesTentativa = [8, 7.5, 7, 6.5, 6]
  const yAposCabecalho = 91 // altura fixa aproximada do cabecalho (header+titulo+partes)
  const areaUtilInferior = PAGE_H - MARGEM_INFERIOR

  // Estima altura de uma linha da tabela conforme a fonte (padding + texto).
  function alturaLinhaTabela(fonte: number): number {
    return fonte * 0.5 + 6 // cellPadding 3 top+bottom + texto
  }

  let fonteEscolhida = 6
  for (const f of fontesTentativa) {
    const alturaTabela = (rows.length + 1) * alturaLinhaTabela(f) // +1 do header
    const alturaFech = alturaFechamento(f)
    const totalNecessario = yAposCabecalho + alturaTabela + 6 + alturaFech
    if (totalNecessario <= areaUtilInferior) {
      fonteEscolhida = f
      break
    }
  }

  // ── DESENHA ──
  let yTabela = desenharCabecalho()

  autoTable(doc, {
    startY: yTabela,
    head: [head],
    body: rows,
    margin: { left: MG, right: MG, bottom: MARGEM_INFERIOR, top: 20 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: fonteEscolhida, fontStyle: 'bold' },
    columnStyles: montarColumnStyles() as never,
    bodyStyles: { fontSize: fonteEscolhida, textColor: NAVY },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    styles: { cellPadding: 3, lineColor: CINZA_CL, lineWidth: 0.1 },
    didDrawPage: () => {
      desenharRodape()
    },
  })

  yTabela = ((doc as DocComAutoTable).lastAutoTable?.finalY || yTabela) + 6

  // ── Fechamento coeso: cabe no espaco restante? Se nao, nova pagina. ──
  const alturaFech = alturaFechamento(fonteEscolhida)
  if (yTabela + alturaFech > areaUtilInferior) {
    doc.addPage()
    desenharRodape() // a nova pagina precisa do rodape (didDrawPage nao dispara aqui)
    yTabela = 20
  }
  desenharFechamento(yTabela, fonteEscolhida)

  doc.save('orcamento-' + (cabecalho.numero || 'infoxtec') + '.pdf')
}
