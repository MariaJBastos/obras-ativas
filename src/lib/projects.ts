// Lógica pura (testável com `node --test`): ordem da lista de projetos.
// Primeiro os PR, depois as AT, por número crescente; outros prefixos no fim.

const PREFIX_ORDER = ['PR', 'AT']

function sortKey(code: string): [number, string, number] {
  const match = code.trim().toUpperCase().match(/^([A-Z]+)\s*0*(\d+)/)
  if (!match) return [PREFIX_ORDER.length + 1, code, 0]
  const [, prefix, digits] = match
  const rank = PREFIX_ORDER.indexOf(prefix)
  return [rank === -1 ? PREFIX_ORDER.length : rank, prefix, Number(digits)]
}

export function compareProjectCodes(a: string, b: string): number {
  const [ra, pa, na] = sortKey(a)
  const [rb, pb, nb] = sortKey(b)
  return ra - rb || pa.localeCompare(pb) || na - nb || a.localeCompare(b)
}

export type SortKey = 'code' | 'title' | 'client'
export type SortDir = 'asc' | 'desc'

interface Sortable { code: string; title: string | null; client: string | null }

// Ordena por nº de projeto, obra ou cliente. Empates (ex: mesmo cliente)
// ficam sempre por nº de projeto crescente; textos vazios vão para o fim.
export function sortProjects<T extends Sortable>(projects: T[], key: SortKey, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  const text = (p: T) => (key === 'client' ? p.client : p.title ?? p.client) ?? ''
  return [...projects].sort((a, b) => {
    if (key === 'code') return sign * compareProjectCodes(a.code, b.code)
    const ta = text(a), tb = text(b)
    if (!ta !== !tb) return ta ? -1 : 1
    return sign * ta.localeCompare(tb, 'pt', { sensitivity: 'base' }) || compareProjectCodes(a.code, b.code)
  })
}
