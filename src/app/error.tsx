'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="font-medium text-slate-800">Não foi possível ler os dados do Odoo.</p>
        <button onClick={reset} className="rounded-xl bg-navy text-white px-4 py-2 text-sm font-medium">
          Tentar de novo
        </button>
      </div>
    </main>
  )
}
