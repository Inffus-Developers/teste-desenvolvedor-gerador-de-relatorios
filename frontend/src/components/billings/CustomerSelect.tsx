'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CustomerOption } from '@/services/customer';

interface CustomerSelectProps {
  customers: CustomerOption[];
  selectedId: number | '';
  onChange: (id: number) => void;
  disabled?: boolean;
}

export function CustomerSelect({
  customers,
  selectedId,
  onChange,
  disabled = false,
}: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown se clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foca automaticamente no input de busca ao abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Cliente atualmente selecionado
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedId) || null;
  }, [customers, selectedId]);

  // Filtra em memória instantaneamente pelo que foi digitado
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.document.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
      >
        <span className={selectedCustomer ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {selectedCustomer
            ? `${selectedCustomer.name} (Doc: ${selectedCustomer.document})`
            : 'Selecione um cliente ativo...'}
        </span>
        <span className="text-slate-400 text-xs ml-2">▼</span>
      </button>

      {/* Caixa Suspensa com Busca Interna */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Input de Busca Dentro do Dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou CPF/CNPJ..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Lista de Opções Rolável */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="p-3 text-xs text-center text-slate-400">
                Nenhum cliente ativo encontrado com &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = customer.id === selectedId;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      onChange(customer.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{customer.name}</span>
                    <span className="text-slate-400 text-[11px]">Doc: {customer.document}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}