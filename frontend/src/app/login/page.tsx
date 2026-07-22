import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="stripe-panel-dark relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 stripe-mesh opacity-20" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Inffus</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-0.03em]">
            Infraestrutura de faturamento preparada para escala.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Clientes, cobranças, juros compostos e relatórios de alto volume em um painel único.
          </p>
        </div>
        <ul className="relative space-y-3 text-sm text-white/75">
          <li className="flex items-center gap-2">
            <span className="badge bg-white/10 text-white">01</span>
            Gestão de clientes e cobranças
          </li>
          <li className="flex items-center gap-2">
            <span className="badge bg-white/10 text-white">02</span>
            Relatórios com filtros e totalizadores
          </li>
          <li className="flex items-center gap-2">
            <span className="badge bg-white/10 text-white">03</span>
            Exportação assíncrona via fila
          </li>
        </ul>
      </section>

      <section className="stripe-mesh flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Inffus</p>
            <h1 className="page-title mt-2">Billing</h1>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <header className="mb-6">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--color-ink)]">Entrar na conta</h2>
              <p className="mt-1 text-sm text-muted">
                Use suas credenciais para acessar clientes, cobranças e relatórios.
              </p>
            </header>

            <LoginForm />
          </div>
        </div>
      </section>
    </div>
  );
}
