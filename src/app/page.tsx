import Header from '@/components/Header'
import ProjectList from '@/components/ProjectList'
import { getActiveProjects } from '@/lib/odoo'
import { requireAuth } from '@/lib/session'

// Sempre ao vivo: lê o Odoo a cada pedido.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  await requireAuth()
  const projects = await getActiveProjects()

  return (
    <>
      <Header subtitle="Projetos em curso e em preparação" />
      <main className="max-w-3xl mx-auto px-4 py-5">
        <ProjectList projects={projects} />
      </main>
    </>
  )
}
