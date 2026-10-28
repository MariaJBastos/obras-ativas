import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateMaterials, analyticShare, normalize } from '../src/lib/materials.ts'
import { compareProjectCodes } from '../src/lib/projects.ts'

const line = (over) => ({
  id: 1, name: 'x', product_id: [10, 'Cabo H07V-K 2,5mm2'], product_qty: 100,
  uom_id: [1, 'm'], analytic_distribution: { '33': 100 }, ...over,
})

test('repartição 60/40 entre projetos', () => {
  const lines = [line({ analytic_distribution: { '33': 60, '40': 40 } })]
  assert.deepEqual(aggregateMaterials(lines, 33), [{ product: 'Cabo H07V-K 2,5mm2', quantity: 60, uom: 'm' }])
  assert.deepEqual(aggregateMaterials(lines, 40), [{ product: 'Cabo H07V-K 2,5mm2', quantity: 40, uom: 'm' }])
})

test('chaves compostas usam correspondência exata de ids', () => {
  assert.equal(analyticShare({ '33,72': 50, '133': 50 }, 33), 0.5)
  assert.equal(analyticShare({ '33,72': 50, '133': 50 }, 3), 0)
  assert.equal(analyticShare(false, 33), 0)
})

test('linhas sem parte para o projeto ficam de fora', () => {
  assert.deepEqual(aggregateMaterials([line({ analytic_distribution: { '40': 100 } })], 33), [])
})

test('soma o mesmo produto na mesma unidade, separa unidades diferentes', () => {
  const lines = [
    line({ id: 1, product_qty: 100 }),
    line({ id: 2, product_qty: 50 }),
    line({ id: 3, product_qty: 2, uom_id: [2, 'Rolo'] }),
    line({ id: 4, product_id: [11, 'Abraçadeira'], product_qty: 3, uom_id: [3, 'Units'] }),
  ]
  assert.deepEqual(aggregateMaterials(lines, 33), [
    { product: 'Abraçadeira', quantity: 3, uom: 'Units' },
    { product: 'Cabo H07V-K 2,5mm2', quantity: 150, uom: 'm' },
    { product: 'Cabo H07V-K 2,5mm2', quantity: 2, uom: 'Rolo' },
  ])
})

test('arredonda quantidades a 3 casas', () => {
  const lines = [line({ product_qty: 1, analytic_distribution: { '33': 33.3333 } })]
  assert.equal(aggregateMaterials(lines, 33)[0].quantity, 0.333)
})

test('quantidade 0 não aparece', () => {
  assert.deepEqual(aggregateMaterials([line({ product_qty: 0 })], 33), [])
})

test('linha sem produto usa a descrição', () => {
  const lines = [line({ product_id: false, name: '  Quadro elétrico à medida ' })]
  assert.equal(aggregateMaterials(lines, 33)[0].product, 'Quadro elétrico à medida')
})

test('pesquisa ignora acentos e maiúsculas', () => {
  assert.equal(normalize('Filtro Via Húmida – Dragão Abrasivo').includes(normalize('DRAGAO')), true)
})


test('ordem: PR por número crescente, depois AT, depois o resto', () => {
  const codes = ['AT0013', 'PR0100', 'AT0009', 'FM0004', 'PR0003', 'PR0021', 'XYZ', 'PR0010']
  assert.deepEqual([...codes].sort(compareProjectCodes),
    ['PR0003', 'PR0010', 'PR0021', 'PR0100', 'AT0009', 'AT0013', 'FM0004', 'XYZ'])
})
