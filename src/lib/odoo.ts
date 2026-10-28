import 'server-only'
import { aggregateMaterials, type Material, type OdooRelation, type PurchaseLine } from './materials'

// Esta app só LÊ do Odoo — nunca escrever (write/create/unlink) aqui.
// Também nunca pedir campos de preço/faturação (price_*, qty_invoiced, ...):
// a equipa de campo não os deve ver, e assim nem chegam ao servidor.

const ODOO_URL = process.env.ODOO_URL!
const ODOO_DB  = process.env.ODOO_DB!
const ODOO_USERNAME = process.env.ODOO_USERNAME!
const ODOO_API_KEY  = process.env.ODOO_API_KEY!

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// O Odoo por vezes devolve 429 (rate limit). Repete com espera crescente
// antes de desistir, em vez de falhar logo à primeira (igual ao Finance).
async function rpc(service: 'common' | 'object', method: string, args: unknown[], attempt = 1): Promise<unknown> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: { service, method, args } }),
    cache: 'no-store',
  })
  if (res.status === 429 && attempt < 4) {
    await sleep(500 * attempt)
    return rpc(service, method, args, attempt + 1)
  }
  if (!res.ok) throw new Error(`Odoo HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.data?.message ?? JSON.stringify(json.error))
  return json.result
}

async function authenticateOdoo(): Promise<number> {
  const uid = await rpc('common', 'authenticate', [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}])
  if (typeof uid !== 'number' || uid === 0) throw new Error('Odoo: autenticação falhou — verifica as credenciais e API key')
  return uid
}

async function execKw(uid: number, model: string, method: string, args: unknown[], kwargs: object = {}) {
  return rpc('object', 'execute_kw', [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs])
}

// O título descritivo do projeto vem do campo "label_tasks" ("Use Tasks as"),
// reaproveitado pela equipa para isso. Normalmente inclui o cliente final
// (ex: "Filtro Via Húmida – Dragão Abrasivo"); não existe campo próprio.
// "Tasks" é o valor por omissão do Odoo, por isso não conta como título.
function cleanProjectTitle(labelTasks: string | false): string | null {
  if (!labelTasks) return null
  const title = labelTasks.trim()
  if (title.length < 5 || title.toLowerCase() === 'tasks') return null
  return title
}

export interface ActiveProject {
  id: number
  code: string
  client: string | null
  title: string | null
  stage: string | null
}

interface RawProject {
  id: number; name: string; partner_id: OdooRelation
  label_tasks: string | false; stage_id: OdooRelation
}

const CLOSED_STAGE = /done|conclu|cancel/i

// Ativos = não arquivados, com cliente (exclui "buckets" internos como
// "Interno") e fora das fases Done/Cancelled. Inclui "Em preparação".
// Projetos cujo cliente é a própria empresa (ex: PR0098/PR0099 "Geral…",
// cliente Triad.AI) são internos, não obras — também ficam de fora.
export async function getActiveProjects(): Promise<ActiveProject[]> {
  const uid = await authenticateOdoo()
  const [projects, companies] = await Promise.all([
    execKw(uid, 'project.project', 'search_read',
      [[['active', '=', true], ['is_template', '=', false], ['partner_id', '!=', false]]],
      { fields: ['id', 'name', 'partner_id', 'label_tasks', 'stage_id'], order: 'name asc', limit: 500 }
    ) as Promise<RawProject[]>,
    execKw(uid, 'res.company', 'search_read', [[]], { fields: ['partner_id'] }) as Promise<{ partner_id: OdooRelation }[]>,
  ])
  const companyPartners = new Set(companies.flatMap((c) => Array.isArray(c.partner_id) ? [c.partner_id[0]] : []))

  return projects
    .filter((p) => !(Array.isArray(p.stage_id) && CLOSED_STAGE.test(p.stage_id[1])))
    .filter((p) => !(Array.isArray(p.partner_id) && companyPartners.has(p.partner_id[0])))
    .map((p) => ({
      id: p.id,
      code: p.name,
      client: Array.isArray(p.partner_id) ? p.partner_id[1] : null,
      title: cleanProjectTitle(p.label_tasks),
      stage: Array.isArray(p.stage_id) ? p.stage_id[1] : null,
    }))
}

async function readAll<T>(uid: number, model: string, domain: unknown[], fields: string[]): Promise<T[]> {
  const result: T[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const page = await execKw(uid, model, 'search_read', [domain], {
      fields, order: 'id asc', limit: pageSize, offset,
    }) as T[]
    result.push(...page)
    if (page.length < pageSize) return result
  }
}

// Material já encomendado para o projeto: linhas de encomendas de compra
// CONFIRMADAS cuja distribuição analítica inclui a conta do projeto (a mesma
// regra de atribuição da vista de Compras do Finance — nunca order_id.project_id).
export async function getProjectMaterials(odooProjectId: number): Promise<Material[]> {
  const uid = await authenticateOdoo()
  const projects = await execKw(uid, 'project.project', 'read', [[odooProjectId]], {
    fields: ['account_id'],
  }) as { account_id: OdooRelation }[]
  const account = projects[0]?.account_id
  if (!Array.isArray(account)) return []
  const accountId = account[0]

  const lines = await readAll<PurchaseLine>(uid, 'purchase.order.line',
    [['analytic_distribution', 'in', [accountId]], ['state', '=', 'purchase'], ['display_type', '=', false]],
    ['name', 'product_id', 'product_qty', 'uom_id', 'analytic_distribution'])

  return aggregateMaterials(lines, accountId)
}
