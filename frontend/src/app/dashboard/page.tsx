'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
        <p className="text-sm text-slate-500 mt-1">
            Selecione um dos módulos para começar a gerenciar a base de faturamentos!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Clientes */}
          <Link
            href="/customers"
            className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              👥
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Clientes</h2>
            <p className="text-sm text-slate-500">
              Cadastre, edite e consulte a base de clientes ativos e inativos.
            </p>
          </Link>

          {/* Card Cobranças */}
          <Link
            href="/billings"
            className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-500 transition-all group"
          >
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              💳
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Cobranças</h2>
            <p className="text-sm text-slate-500">
              Gerencie faturas com filtros por cliente, vencimento e status.
            </p>
          </Link>

          {/* Card Relatórios */}
          <Link
            href="/reports"
            className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all group"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              📊
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Relatórios de Alta Carga</h2>
            <p className="text-sm text-slate-500">
              Filtros combinados por data e status, sumário financeiro e exportação CSV em stream.
            </p>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}