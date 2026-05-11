import { useState } from 'react';
import { useEntity } from '../context/EntityContext';
import { TimelineChart } from '../components/TimelineChart';
import { AnomalyDetector } from '../components/AnomalyDetector';
import { ThemeEvolutionChart } from '../components/ThemeEvolutionChart';
import { TrendAlertWidget } from '../components/TrendAlertWidget';

export function TrendsPage() {
  const { selectedId } = useEntity();
  const [dateRange, setDateRange] = useState(30);
  const [sensitivity, setSensitivity] = useState(2.5);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  if (!selectedId) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Selecione uma entidade para analisar tendências</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Análise de Tendências</h1>
        <p className="text-gray-600">Detecte anomalias, tendências e evolução de temas</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>1 semana</option>
              <option value={14}>2 semanas</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Sensibilidade (Z-Score)</label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={1.5}>Baixa (1.5)</option>
              <option value={2.0}>Média (2.0)</option>
              <option value={2.5}>Alta (2.5)</option>
              <option value={3.0}>Muito Alta (3.0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* Timeline Chart */}
        <TimelineChart entityId={selectedId} apiUrl={apiUrl} days={dateRange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Anomalies and Trends */}
          <div className="lg:col-span-2">
            <AnomalyDetector entityId={selectedId} apiUrl={apiUrl} sensitivity={sensitivity} />
          </div>

          {/* Alerts Widget */}
          <div>
            <TrendAlertWidget entityId={selectedId} apiUrl={apiUrl} />
          </div>
        </div>

        {/* Theme Evolution */}
        <ThemeEvolutionChart entityId={selectedId} apiUrl={apiUrl} days={dateRange} />
      </div>
    </div>
  );
}
