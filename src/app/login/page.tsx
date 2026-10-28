'use client'

import { useActionState } from 'react'
import { Lock } from 'lucide-react'
import Logo from '@/components/Logo'
import { login } from './actions'

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null)

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <form action={formAction} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="font-semibold text-navy leading-tight">Obras Ativas</h1>
            <p className="text-sm text-slate-500">TRIAD Automation</p>
          </div>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Password da equipa</span>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-navy text-white font-medium py-2.5 disabled:opacity-60"
        >
          {pending ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
