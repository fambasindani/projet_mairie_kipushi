import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AlertCircle, ChevronDown, Search, X } from 'lucide-react';

interface DropdownSearchProps {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
}

const DropdownSearch: React.FC<DropdownSearchProps> = ({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchable = true,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-left flex items-center justify-between transition cursor-pointer ${
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          } ${isOpen ? (error ? 'ring-2 ring-red-500/20 border-red-500' : 'ring-2 ring-indigo-500/20 border-indigo-500') : ''}`}
        >
          <span
            className={
              selectedOption ? 'text-slate-900' : 'text-slate-400'
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && (
              <span
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        {isOpen && (
          <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-400">
                  Chargement...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">
                  Aucun résultat trouvé
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                      String(option.value) === String(value)
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1.5">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
};

export default DropdownSearch;
