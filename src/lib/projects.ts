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
