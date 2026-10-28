import Logo from './Logo'

export default function Header({ subtitle }: { subtitle: string }) {
  return (
    <header className="bg-navy text-white">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <Logo />
        <div>
          <h1 className="font-semibold leading-tight">Obras Ativas</h1>
          <p className="text-sm text-gold">{subtitle}</p>
        </div>
      </div>
    </header>
  )
}
