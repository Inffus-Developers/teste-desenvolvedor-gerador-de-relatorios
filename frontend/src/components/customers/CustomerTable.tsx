import { Customer } from '@/types/customer';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
}

export function CustomerTable({
  customers,
  loading,
  onView,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 font-medium">
        Carregando dados dos clientes...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
        Nenhum cliente encontrado com os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Cliente</th>
            <th className="px-6 py-3.5">Documento</th>
            <th className="px-6 py-3.5">E-mail</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">{customer.name}</td>
              <td className="px-6 py-4 font-mono text-xs text-slate-600">{customer.document}</td>
              <td className="px-6 py-4 text-slate-600">{customer.email}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    customer.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  {/* Botão Visualizar */}
                  <button
                    type="button"
                    onClick={() => onView(customer)}
                    title="Visualizar dados do cliente"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs hover:border-slate-300 active:scale-95"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Visualizar
                  </button>

                  {/* Botão Editar (na paleta verde do sistema) */}
                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    title="Editar cliente"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all shadow-xs hover:brightness-110 active:scale-95"
                    style={{
                      backgroundColor: '#3e5954',
                      color: '#dff6e4',
                    }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Editar
                  </button>

                  {/* Botão Cancelar (substituindo Excluir) */}
                  <button
                    type="button"
                    onClick={() => onDelete(customer.id)}
                    title="Cancelar cliente"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-red-200 bg-red-50/70 hover:bg-red-100/80 text-red-700 transition-all shadow-xs active:scale-95"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}