const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'

function linha(char = '-', cols = 48) {
  return char.repeat(cols)
}

function centralizar(texto: string, cols = 48) {
  const pad = Math.max(0, Math.floor((cols - texto.length) / 2))
  return ' '.repeat(pad) + texto
}

function colunas(esq: string, dir: string, cols = 48) {
  const espaco = cols - esq.length - dir.length
  return esq + ' '.repeat(Math.max(1, espaco)) + dir
}

function truncar(texto: string, max: number) {
  return texto.length > max ? texto.substring(0, max - 1) + '.' : texto
}

export function imprimirVenda(venda: any) {
  const data = new Date(venda.criado_em).toLocaleString('pt-BR')
  const isOrcamento = venda.tipo === 'ORCAMENTO'

  const linhasItens = venda.itens?.map((i: any) => {
    const nome = truncar(i.produto_nome, 28)
    const qtdPreco = `${i.quantidade}x ${fmt(i.preco_unitario)}`
    const sub = fmt(i.subtotal)
    const linha1 = nome
    const linha2 = colunas('  ' + qtdPreco, sub)
    return linha1 + '\n' + linha2
  }).join('\n') || ''

  const corpo = [
    centralizar('CONSTRUPRO ERP'),
    centralizar('Msdos Informatica'),
    linha(),
    centralizar(isOrcamento ? '*** ORÇAMENTO ***' : '*** COMPROVANTE DE VENDA ***'),
    linha(),
    colunas('Nº:', String(venda.numero).padStart(4, '0')),
    colunas('Data:', data),
    colunas('Cliente:', truncar(venda.cliente_nome || 'Consumidor Final', 30)),
    colunas('Vendedor:', truncar(venda.funcionario_nome || '-', 30)),
    linha(),
    'ITEM                         SUBTOTAL',
    linha('-'),
    linhasItens,
    linha('-'),
    colunas('Subtotal:', fmt(venda.subtotal)),
    venda.desconto > 0 ? colunas('Desconto:', '-' + fmt(venda.desconto)) : '',
    linha(),
    colunas('TOTAL:', fmt(venda.total)),
    colunas('Pagamento:', venda.forma_pagamento),
    linha(),
    venda.observacoes ? 'Obs: ' + venda.observacoes : '',
    centralizar(isOrcamento ? 'Orçamento válido por 30 dias' : 'Obrigado pela preferência!'),
    centralizar('Msdos Informatica'),
  ].filter(l => l !== '').join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isOrcamento ? 'Orçamento' : 'Venda'} #${String(venda.numero).padStart(4, '0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.4;
      width: 72mm;
      margin: 0 auto;
      padding: 4mm;
      background: white;
      color: black;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-all;
    }
    @media print {
      body { width: 72mm; margin: 0; padding: 2mm; }
      @page { margin: 2mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <pre>${corpo}</pre>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 1000);
    }
  </script>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=400,height=600')
  if (janela) {
    janela.document.write(html)
    janela.document.close()
    // Usa IPC do Electron para imprimir direto (sem depender do Windows Print)
    window.api?.print?.direct(html, { silent: true }).catch(() => {
      // Fallback: tenta window.print()
      setTimeout(() => janela.print(), 300)
    })
  }
}

export function imprimirA4(venda: any) {
  const isOrcamento = venda.tipo === 'ORCAMENTO'
  const data = new Date(venda.criado_em).toLocaleDateString('pt-BR')
  const validade = new Date(new Date(venda.criado_em).getTime() + 30 * 86400000).toLocaleDateString('pt-BR')

  const linhasItens = venda.itens?.map((i: any, idx: number) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${i.produto_nome}</td>
      <td style="text-align:center">${i.quantidade} ${i.unidade}</td>
      <td style="text-align:right">${fmt(i.preco_unitario)}</td>
      <td style="text-align:right">${i.desconto > 0 ? '-' + fmt(i.desconto) : '-'}</td>
      <td style="text-align:right;font-weight:bold">${fmt(i.subtotal)}</td>
    </tr>`).join('') || ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isOrcamento ? 'Orçamento' : 'Venda'} #${String(venda.numero).padStart(4, '0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20mm 15mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #f97316; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: bold; color: #f97316; }
    .logo span { display: block; font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px; }
    .titulo { text-align: right; }
    .titulo h1 { font-size: 18px; color: #1e293b; }
    .titulo .num { font-size: 28px; font-weight: bold; color: #f97316; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
    .info-box label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
    .info-box span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1e293b; color: white; }
    thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
    .totais { margin-left: auto; width: 260px; }
    .totais table { margin: 0; }
    .totais td { padding: 4px 8px; }
    .totais .total-row { font-size: 15px; font-weight: bold; color: #f97316; border-top: 2px solid #f97316; }
    .footer { margin-top: 40px; }
    .assinatura { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
    .assinatura-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; color: #64748b; text-align: center; }
    .validade { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px 14px; font-size: 11px; color: #9a3412; margin-top: 16px; }
    @media print { body { padding: 10mm 10mm; } @page { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ConstruPro ERP
      <span>Msdos Informatica — Todos os direitos reservados</span>
    </div>
    <div class="titulo">
      <h1>${isOrcamento ? 'ORÇAMENTO' : 'COMPROVANTE DE VENDA'}</h1>
      <div class="num">#${String(venda.numero).padStart(4, '0')}</div>
      <div style="color:#64748b;font-size:11px">Data: ${data}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <label>Cliente</label>
      <span>${venda.cliente_nome || 'Consumidor Final'}</span>
    </div>
    <div class="info-box">
      <label>Forma de Pagamento</label>
      <span>${venda.forma_pagamento}</span>
    </div>
    <div class="info-box">
      <label>Vendedor</label>
      <span>${venda.funcionario_nome || '-'}</span>
    </div>
    <div class="info-box">
      <label>Status</label>
      <span>${venda.status}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Produto / Descrição</th>
        <th style="text-align:center;width:80px">Qtd</th>
        <th style="text-align:right;width:90px">Preço Unit.</th>
        <th style="text-align:right;width:80px">Desconto</th>
        <th style="text-align:right;width:90px">Subtotal</th>
      </tr>
    </thead>
    <tbody>${linhasItens}</tbody>
  </table>

  <div class="totais">
    <table>
      <tr><td>Subtotal:</td><td style="text-align:right">${fmt(venda.subtotal)}</td></tr>
      ${venda.desconto > 0 ? `<tr><td>Desconto:</td><td style="text-align:right;color:#dc2626">- ${fmt(venda.desconto)}</td></tr>` : ''}
      <tr class="total-row"><td>TOTAL:</td><td style="text-align:right">${fmt(venda.total)}</td></tr>
    </table>
  </div>

  ${venda.observacoes ? `<div style="margin-top:16px;padding:10px 14px;background:#f8fafc;border-radius:6px;font-size:11px"><strong>Observações:</strong> ${venda.observacoes}</div>` : ''}

  ${isOrcamento ? `<div class="validade">⚠️ Este orçamento é válido até ${validade}. Após esta data os preços podem sofrer alterações.</div>` : ''}

  <div class="footer">
    <div class="assinatura">
      <div class="assinatura-line">Assinatura do Cliente</div>
      <div class="assinatura-line">Assinatura / Carimbo da Empresa</div>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1200); }
  </script>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=900,height=700')
  if (janela) {
    janela.document.write(html)
    janela.document.close()
    window.api?.print?.direct(html, { silent: true }).catch(() => {
      setTimeout(() => janela.print(), 300)
    })
  }
}

export function gerarPdfCupom(venda: any) {
  const data = new Date(venda.criado_em).toLocaleString('pt-BR')
  const isOrcamento = venda.tipo === 'ORCAMENTO'

  const linhasItens = venda.itens?.map((i: any) => {
    const nome = truncar(i.produto_nome, 28)
    const qtdPreco = `${i.quantidade}x ${fmt(i.preco_unitario)}`
    const sub = fmt(i.subtotal)
    const linha1 = nome
    const linha2 = colunas('  ' + qtdPreco, sub)
    return linha1 + '\n' + linha2
  }).join('\n') || ''

  const corpo = [
    centralizar('CONSTRUPRO ERP'),
    centralizar('Msdos Informatica'),
    linha(),
    centralizar(isOrcamento ? '*** ORÇAMENTO ***' : '*** COMPROVANTE DE VENDA ***'),
    linha(),
    colunas('Nº:', String(venda.numero).padStart(4, '0')),
    colunas('Data:', data),
    colunas('Cliente:', truncar(venda.cliente_nome || 'Consumidor Final', 30)),
    colunas('Vendedor:', truncar(venda.funcionario_nome || '-', 30)),
    linha(),
    'ITEM                         SUBTOTAL',
    linha('-'),
    linhasItens,
    linha('-'),
    colunas('Subtotal:', fmt(venda.subtotal)),
    venda.desconto > 0 ? colunas('Desconto:', '-' + fmt(venda.desconto)) : '',
    linha(),
    colunas('TOTAL:', fmt(venda.total)),
    colunas('Pagamento:', venda.forma_pagamento),
    linha(),
    venda.observacoes ? 'Obs: ' + venda.observacoes : '',
    centralizar(isOrcamento ? 'Orçamento válido por 30 dias' : 'Obrigado pela preferência!'),
    centralizar('Msdos Informatica'),
  ].filter(l => l !== '').join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isOrcamento ? 'Orçamento' : 'Venda'} #${String(venda.numero).padStart(4, '0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.4;
      width: 72mm;
      margin: 0 auto;
      padding: 4mm;
      background: white;
      color: black;
    }
    pre { white-space: pre-wrap; word-break: break-all; }
    @media print {
      body { width: 72mm; margin: 0; padding: 2mm; }
      @page { margin: 2mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <pre>${corpo}</pre>
  <script>
    window.onload = function() {
      var el = document.createElement('h3');
      el.textContent = 'Para salvar como PDF, selecione "Salvar como PDF" no diálogo de impressão.';
      el.style.cssText = 'font-family:Arial;text-align:center;color:#666;margin:12px 0;font-size:11px;';
      document.body.appendChild(el);
    }
  </script>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=400,height=600')
  if (janela) {
    janela.document.write(html)
    janela.document.close()
    setTimeout(() => {
      window.api?.print?.direct(html, { silent: true }).catch(() => {
        janela.print()
      })
    }, 500)
  }
}

export function gerarPdfA4(venda: any) {
  const isOrcamento = venda.tipo === 'ORCAMENTO'
  const data = new Date(venda.criado_em).toLocaleDateString('pt-BR')
  const validade = new Date(new Date(venda.criado_em).getTime() + 30 * 86400000).toLocaleDateString('pt-BR')

  const linhasItens = venda.itens?.map((i: any, idx: number) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${i.produto_nome}</td>
      <td style="text-align:center">${i.quantidade} ${i.unidade}</td>
      <td style="text-align:right">${fmt(i.preco_unitario)}</td>
      <td style="text-align:right">${i.desconto > 0 ? '-' + fmt(i.desconto) : '-'}</td>
      <td style="text-align:right;font-weight:bold">${fmt(i.subtotal)}</td>
    </tr>`).join('') || ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isOrcamento ? 'Orçamento' : 'Venda'} #${String(venda.numero).padStart(4, '0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20mm 15mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #f97316; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: bold; color: #f97316; }
    .logo span { display: block; font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px; }
    .titulo { text-align: right; }
    .titulo h1 { font-size: 18px; color: #1e293b; }
    .titulo .num { font-size: 28px; font-weight: bold; color: #f97316; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
    .info-box label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
    .info-box span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1e293b; color: white; }
    thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
    .totais { margin-left: auto; width: 260px; }
    .totais table { margin: 0; }
    .totais td { padding: 4px 8px; }
    .totais .total-row { font-size: 15px; font-weight: bold; color: #f97316; border-top: 2px solid #f97316; }
    .footer { margin-top: 40px; }
    .assinatura { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
    .assinatura-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; color: #64748b; text-align: center; }
    .validade { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px 14px; font-size: 11px; color: #9a3412; margin-top: 16px; }
    @media print { body { padding: 10mm 10mm; } @page { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ConstruPro ERP
      <span>Msdos Informatica — Todos os direitos reservados</span>
    </div>
    <div class="titulo">
      <h1>${isOrcamento ? 'ORÇAMENTO' : 'COMPROVANTE DE VENDA'}</h1>
      <div class="num">#${String(venda.numero).padStart(4, '0')}</div>
      <div style="color:#64748b;font-size:11px">Data: ${data}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <label>Cliente</label>
      <span>${venda.cliente_nome || 'Consumidor Final'}</span>
    </div>
    <div class="info-box">
      <label>Forma de Pagamento</label>
      <span>${venda.forma_pagamento}</span>
    </div>
    <div class="info-box">
      <label>Vendedor</label>
      <span>${venda.funcionario_nome || '-'}</span>
    </div>
    <div class="info-box">
      <label>Status</label>
      <span>${venda.status}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Produto / Descrição</th>
        <th style="text-align:center;width:80px">Qtd</th>
        <th style="text-align:right;width:90px">Preço Unit.</th>
        <th style="text-align:right;width:80px">Desconto</th>
        <th style="text-align:right;width:90px">Subtotal</th>
      </tr>
    </thead>
    <tbody>${linhasItens}</tbody>
  </table>

  <div class="totais">
    <table>
      <tr><td>Subtotal:</td><td style="text-align:right">${fmt(venda.subtotal)}</td></tr>
      ${venda.desconto > 0 ? `<tr><td>Desconto:</td><td style="text-align:right;color:#dc2626">- ${fmt(venda.desconto)}</td></tr>` : ''}
      <tr class="total-row"><td>TOTAL:</td><td style="text-align:right">${fmt(venda.total)}</td></tr>
    </table>
  </div>

  ${venda.observacoes ? `<div style="margin-top:16px;padding:10px 14px;background:#f8fafc;border-radius:6px;font-size:11px"><strong>Observações:</strong> ${venda.observacoes}</div>` : ''}

  ${isOrcamento ? `<div class="validade">Este orçamento é válido até ${validade}. Após esta data os preços podem sofrer alterações.</div>` : ''}

  <div class="footer">
    <div class="assinatura">
      <div class="assinatura-line">Assinatura do Cliente</div>
      <div class="assinatura-line">Assinatura / Carimbo da Empresa</div>
    </div>
  </div>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=900,height=700')
  if (janela) {
    janela.document.write(html)
    janela.document.close()
    setTimeout(() => {
      window.api?.print?.direct(html, { silent: true }).catch(() => {
        janela.print()
      })
    }, 500)
  }
}

export function compartilharWhatsApp(venda: any) {
  const num = String(venda.numero).padStart(4, '0')
  const isOrc = venda.tipo === 'ORCAMENTO'
  const itens = venda.itens?.map((i: any) =>
    `  • ${i.produto_nome} — ${i.quantidade} ${i.unidade} x ${fmt(i.preco_unitario)} = ${fmt(i.subtotal)}`
  ).join('\n') || ''

  const texto = [
    `*${isOrc ? 'ORÇAMENTO' : 'PEDIDO'} #${num} — ConstruPro ERP*`,
    `Data: ${new Date(venda.criado_em).toLocaleDateString('pt-BR')}`,
    `Cliente: ${venda.cliente_nome || 'Consumidor Final'}`,
    '',
    '*Itens:*',
    itens,
    '',
    venda.desconto > 0 ? `Subtotal: ${fmt(venda.subtotal)}\nDesconto: -${fmt(venda.desconto)}` : '',
    `*Total: ${fmt(venda.total)}*`,
    `Pagamento: ${venda.forma_pagamento}`,
    isOrc ? '\n_Orçamento válido por 30 dias._' : '',
    '\n_ConstruPro ERP — Msdos Informatica_',
  ].filter(l => l !== undefined).join('\n')

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
  window.open(url, '_blank')
}
