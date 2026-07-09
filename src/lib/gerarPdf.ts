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

export function gerarPdf(dados: DadosPdf) {
  const { cabecalho, cliente, itens, config, logoBase64 } = dados

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const mg = 15
  let y = 15

  const navy: [number, number, number] = [13, 27, 46]
  const green: [number, number, number] = [29, 185, 84]
  const blue: [number, number, number] = [45, 142, 245]
  const cinza: [number, number, number] = [90, 100, 115]
  const cinzaCl: [number, number, number] = [200, 210, 225]

  // Toggles PDF: mostrar imposto / desconto no documento do cliente
  const showI = config.impNoPdf
  const showD = config.descNoPdf
  const showDetalhe = config.detalhePdf

  const contatoLinha = [cabecalho.telefoneContato, cabecalho.emailContato].filter(Boolean).join('  .  ')

  // ── HEADER ──
  doc.setFillColor(...navy)
  doc.rect(0, 0, W, 44, 'F')
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', mg, 11, 52, 22)
    } catch {
      // ignora se o logo falhar
    }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...green)
  doc.text('ORÇAMENTO', W - mg, 18, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...cinzaCl)
  if (cabecalho.numero) doc.text(cabecalho.numero, W - mg, 25, { align: 'right' })
  if (contatoLinha) doc.text(contatoLinha, W - mg, 33, { align: 'right' })
  y = 52

  // ── TITULO + DATAS ──
  if (cabecalho.titulo) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...navy)
    const titLines = doc.splitTextToSize(cabecalho.titulo, W - mg * 2)
    doc.text(titLines, mg, y)
    y += titLines.length * 6 + 2
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...cinza)
  const dE = fmtData(cabecalho.dataEmissao)
  const dV = fmtData(cabecalho.validade)
  const infoLinha = [dE ? 'Emitido em ' + dE : '', dV ? 'Válido até ' + dV : ''].filter(Boolean).join('    ')
  if (infoLinha) {
    doc.text(infoLinha, mg, y)
    y += 8
  }
  doc.setDrawColor(...cinzaCl)
  doc.setLineWidth(0.3)
  doc.line(mg, y, W - mg, y)
  y += 7

  // ── EMITENTE | CLIENTE ──
  const cw = (W - mg * 2 - 6) / 2
  doc.setFillColor(238, 244, 252)
  doc.roundedRect(mg, y, cw, 32, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...blue)
  doc.text('EMITENTE', mg + 4, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...navy)
  doc.text('INFOXTEC TECNOLOGIA E SERVICOS LTDA', mg + 4, y + 11, { maxWidth: cw - 8 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinza)
  doc.text('CNPJ: 04.309.223/0001-96', mg + 4, y + 18)
  doc.text('Rua Silveira Martins, 27, Cabula - 41150-000, Salvador/BA', mg + 4, y + 23, { maxWidth: cw - 8 })
  if (contatoLinha) doc.text(contatoLinha, mg + 4, y + 29, { maxWidth: cw - 8 })

  const cx = mg + cw + 6
  doc.setFillColor(238, 244, 252)
  doc.roundedRect(cx, y, cw, 32, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...green)
  doc.text('CLIENTE / TOMADOR', cx + 4, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...navy)
  doc.text(cliente.nome || '\u2014', cx + 4, y + 11, { maxWidth: cw - 8 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinza)
  if (cliente.cnpj) doc.text('CNPJ: ' + cliente.cnpj, cx + 4, y + 18)
  if (cliente.endereco) doc.text(cliente.endereco, cx + 4, y + 23, { maxWidth: cw - 8 })
  const contatoCliente = cliente.responsavel || cliente.emailTelefone
  if (contatoCliente) doc.text('Resp: ' + contatoCliente, cx + 4, y + 29, { maxWidth: cw - 8 })
  y += 39

  // ── TABELA DE ITENS (Opcao A: colunas que somam; imposto vai no resumo) ──
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
    // Valor unitario real que FECHA a conta: total da linha / quantidade.
    // (o preco cheio ja embute a quantidade, entao dividimos para exibir o unitario)
    const valorUnitario = item.qtd > 0 ? r.total / item.qtd : r.total
    if (showDetalhe) {
      rows.push([
        rows.length + 1,
        item.descricao || '--',
        item.qtd.toLocaleString('pt-BR'),
        fmtBR(valorUnitario),
        fmtBR(r.total),
      ])
    } else {
      rows.push([rows.length + 1, item.descricao || '--'])
    }
  }

  const head = showDetalhe
    ? ['#', 'Descrição', 'Qtd', 'Valor Unit.', 'Total']
    : ['#', 'Descrição']

  const columnStyles: Record<number, Record<string, unknown>> = showDetalhe
    ? {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      }
    : {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'left' },
      }

  autoTable(doc, {
    startY: y,
    head: [head],
    body: rows,
    margin: { left: mg, right: mg },
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    columnStyles: columnStyles as never,
    bodyStyles: { fontSize: 8, textColor: navy },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    styles: { cellPadding: 3, lineColor: cinzaCl, lineWidth: 0.1 },
  })

  y = ((doc as DocComAutoTable).lastAutoTable?.finalY || y) + 5

  // ── DESCONTO (se toggle e houver) ──
  const bw = 90
  const bx = W - mg - bw
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
      margin: { left: bx, right: mg },
      tableWidth: bw,
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left', textColor: cinza },
        1: { halign: 'right', textColor: navy, fontStyle: 'bold' },
      },
      styles: { cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineColor: cinzaCl, lineWidth: 0.1 },
    })
    y = ((doc as DocComAutoTable).lastAutoTable?.finalY || y) + 2
  }

  // ── BOX TOTAL ──
  doc.setFillColor(...navy)
  doc.roundedRect(bx, y, bw, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL A PAGAR', bx + 4, y + 6)
  doc.setFontSize(13)
  doc.setTextColor(...green)
  doc.text(fmtBR(tFinal), W - mg - 3, y + 10, { align: 'right' })
  y += 19

  // ── OBSERVACOES ──
  const oP = cabecalho.condicoesPagamento
  const oG = cabecalho.observacoesGerais
  if (oP || oG) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...navy)
    doc.text('Observações e Condições', mg, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...cinza)
    if (oP) {
      doc.text('Pagamento: ' + oP, mg, y)
      y += 5
    }
    if (oG) {
      const lines = doc.splitTextToSize(oG, W - mg * 2 - bw - 10)
      doc.text(lines, mg, y)
    }
  }

  // ── RODAPE ──
  const pH = 297
  doc.setFillColor(...navy)
  doc.rect(0, pH - 14, W, 14, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinzaCl)
  doc.text(
    'Infoxtec Tecnologia e Serviços Ltda - CNPJ 04.309.223/0001-96 - Rua Silveira Martins, 27, Cabula, Salvador/BA',
    mg,
    pH - 6
  )
  doc.setTextColor(...green)
  doc.text('infoxtec.com.br', W - mg, pH - 6, { align: 'right' })

  doc.save('orcamento-' + (cabecalho.numero || 'infoxtec') + '.pdf')
}
