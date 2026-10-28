'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import { normalize } from '@/lib/materials'
import type { ActiveProject } from '@/lib/odoo'
import StageBadge from './StageBadge'

export default function ProjectList({ projects }: { projects: ActiveProject[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean)
    if (!terms.length) return projects
    return projects.filter((p) => {
      const haystack = normalize([p.code, p.client, p.title].filter(Boolean).join(' '))
      return terms.every((t) => haystack.includes(t))
    })
  }, [projects, query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar nº, cliente ou obra…"
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <p className="text-sm text-slate-500">
        {filtered.length} {filtered.length === 1 ? 'projeto' : 'projetos'}
      </p>

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projeto/${p.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 active:bg-slate-50 hover:border-gold"
            >
              {/* A descrição da obra é o que a equipa reconhece no terreno;
                  o cliente fica como informação secundária. */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-navy">{p.code}</span>
                  <StageBadge stage={p.stage} />
                </div>
                <p className="text-base font-semibold text-slate-900 leading-snug">{p.title ?? p.client}</p>
                {p.title && p.client && <p className="text-xs text-slate-400">{p.client}</p>}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-8">Nenhum projeto encontrado.</p>
      )}
    </div>
  )
}
