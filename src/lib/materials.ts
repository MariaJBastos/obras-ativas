// Lógica pura (sem Odoo nem Next) para poder ser testada com `node --test`.
// Só sintaxe TypeScript "apagável": os testes importam este ficheiro
// diretamente com o type stripping do Node.

export type OdooRelation = [number, string] | false

export interface PurchaseLine {
  id: number
  name: string | false
  product_id: OdooRelation
  product_qty: number
  uom_id: OdooRelation
  analytic_distribution: Record<string, number> | false
}

export interface Material {
  product: string
  quantity: number
  uom: string
}

// Uma chave pode combinar contas de planos diferentes ("33,72"). Somar
// apenas as parcelas que contêm a conta exata, nunca fazer match por texto.
// (Mesma regra do Dashboard Financeiro.)
export function analyticShare(distribution: PurchaseLine['analytic_distribution'], accountId: number): number {
  return Object.entries(distribution || {}).reduce((total, [accounts, percent]) =>
    accounts.split(',').some(id => Number(id) === accountId) ? total + percent / 100 : total, 0)
}

// A mesma encomenda pode servir vários projetos: a quantidade atribuída a
// este projeto é a quantidade da linha × a percentagem da sua conta
// analítica. Linhas do mesmo produto e unidade somam-se numa só.
export function aggregateMaterials(lines: PurchaseLine[], accountId: number): Material[] {
  const byKey = new Map<string, Material>()
  for (const line of lines) {
    const share = analyticShare(line.analytic_distribution, accountId)
    if (share <= 0) continue
    const product = Array.isArray(line.product_id) ? line.product_id[1] : (line.name || '').trim()
    if (!product) continue
    const uom = Array.isArray(line.uom_id) ? line.uom_id[1] : ''
    const key = `${product}\u0000${uom}`
    const existing = byKey.get(key)
    const quantity = (line.product_qty ?? 0) * share
    if (existing) existing.quantity += quantity
    else byKey.set(key, { product, quantity, uom })
  }
  // Linhas reduzidas a 0 na encomenda não são material coberto.
  return [...byKey.values()]
    .map(m => ({ ...m, quantity: Math.round(m.quantity * 1000) / 1000 }))
    .filter(m => m.quantity > 0)
    .sort((a, b) => a.product.localeCompare(b.product, 'pt'))
}

// Para a pesquisa: ignora maiúsculas e acentos ("dragao" encontra "Dragão").
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
