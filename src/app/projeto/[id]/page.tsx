import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import Header from '@/components/Header'
import StageBadge from '@/components/StageBadge'
import { getActiveProjects, getProjectMaterials } from '@/lib/odoo'

export const dynamic = 'force-dynamic'

const formatQty = (n: number) => n.toLocaleString('pt-PT', { maximumFractionDigits: 3 })

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const projectId = Number(id)
  if (!Number.isInteger(projectId)) notFound()

  // Só projetos ativos — não expor obras fechadas a quem adivinhe um id.
  const project = (await getActiveProjects()).find((p) => p.id === projectId)
  if (!project) notFound()

  const materials = await getProjectMaterials(projectId)

  return (
    <>
      <Header subtitle="Material já encomendado" />
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy">
          <ArrowLeft className="w-4 h-4" /> Todos os projetos
        </Link>

        <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-navy text-xl">{project.code}</h2>
            <StageBadge stage={project.stage} />
          </div>
          {project.client && <p className="font-medium text-slate-700">{project.client}</p>}
          {project.title && <p className="text-sm text-slate-500">{project.title}</p>}
        </section>

        <section className="bg-white rounded-xl border border-slate-200">
          <h3 className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-800">
            <Package className="w-4 h-4 text-gold" />
            Materiais
            <span className="text-sm font-normal text-slate-500">({materials.length})</span>
          </h3>
          {materials.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">Ainda não há material encomendado.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {materials.map((m) => (
                <li key={`${m.product}|${m.uom}`} className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-slate-800 min-w-0 break-words">{m.product}</span>
                  <span className="text-sm font-semibold text-navy whitespace-nowrap">
                    {formatQty(m.quantity)} {m.uom}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Encomendas de compra confirmadas no Odoo atribuídas a este projeto.
        </p>
      </main>
    </>
  )
}
