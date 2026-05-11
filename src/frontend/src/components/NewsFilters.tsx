import { useState, useEffect } from 'react';

interface NewsFiltersProps {
  onFilter: (filters: {
    sentiment: string;
    source: string;
    region: string;
    days: string;
  }) => void;
  sources: string[];
  regions: string[];
}

export function NewsFilters({ onFilter, sources, regions }: NewsFiltersProps) {
  const [sentiment, setSentiment] = useState('all');
  const [source, setSource] = useState('all');
  const [region, setRegion] = useState('all');
  const [days, setDays] = useState('7');

  // Debounce filters to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilter({ sentiment, source, region, days });
    }, 300);

    return () => clearTimeout(timer);
  }, [sentiment, source, region, days, onFilter]);

  const handleReset = () => {
    setSentiment('all');
    setSource('all');
    setRegion('all');
    setDays('7');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 sticky top-16 z-40 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filtros</h3>
        <button
          onClick={handleReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
        >
          Limpar filtros
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sentiment Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Sentimento</label>
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="positive">Positivo</option>
            <option value="negative">Negativo</option>
            <option value="neutral">Neutro</option>
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Fonte</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src.length > 15 ? src.substring(0, 15) + '...' : src}
              </option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Região</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* Days Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Período</label>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Últimas 24h</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
      </div>
    </div>
  );
}
