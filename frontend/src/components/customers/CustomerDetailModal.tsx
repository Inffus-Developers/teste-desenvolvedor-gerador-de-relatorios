import { Customer } from '@/types/customer';

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export function CustomerDetailModal({
  isOpen,
  customer,
  onClose,
  onEdit,
}: CustomerDetailModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{customer.name}</h2>
            <p className="text-xs text-slate-500">ID do Cliente: #{customer.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </header>

        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Documento</span>
              <span className="font-medium text-slate-900">{customer.document}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${
                  customer.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {customer.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase">E-mail</span>
            <span className="font-medium text-slate-900">{customer.email}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div>
              <span className="block font-semibold">Cadastrado em:</span>
              <span>{new Date(customer.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="block font-semibold">Última atualização:</span>
              <span>{new Date(customer.updated_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(customer);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Editar Cliente
          </button>
        </footer>
      </div>
    </div>
  );
}