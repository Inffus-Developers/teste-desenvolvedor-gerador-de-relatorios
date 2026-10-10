interface CustomerFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'active' | 'inactive' | '') => void;
}

export function CustomerFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, documento ou e-mail..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />
      </div>

      <div className="w-full sm:w-48">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as 'active' | 'inactive' | '')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
    </div>
  );
}