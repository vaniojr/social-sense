import { useState, useEffect } from 'react';

interface Anomaly {
  date: string;
  metric: string;
  z_score: number;
  value: number;
  description: string;
}

interface AnomalyDetectorProps {
  entityId: string;
  apiUrl: string;
  sensitivity: number;
}

export function AnomalyDetector({ entityId, apiUrl, sensitivity }: AnomalyDetectorProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnomalies();
  }, [entityId, sensitivity]);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/trends/anomalies?entity_id=${entityId}&sensitivity=${sensitivity}`
      );
      if (!response.ok) throw new Error('Erro ao carregar anomalias');
      const result = await response.json();
      setAnomalies(result.anomalies || []);
    } catch (err) {
      console.error('❌ Error fetching anomalies:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (zScore: number) => {
    const absScore = Math.abs(zScore);
    if (absScore > 3.0) return 'bg-red-100 text-red-800';
    if (absScore > 2.5) return 'bg-orange-100 text-orange-800';
    if (absScore > 2.0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSeverityBadge = (zScore: number) => {
    const absScore = Math.abs(zScore);
    if (absScore > 3.0) return '🔴 Crítica';
    if (absScore > 2.5) return '🟠 Alta';
    if (absScore > 2.0) return '🟡 Média';
    return '🟢 Baixa';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600">Detectando anomalias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Anomalias Detectadas</h3>

      {anomalies.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Nenhuma anomalia detectada com sensibilidade {sensitivity}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Métrica</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Z-Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Severidade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {anomalies.map((anomaly, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-900">{anomaly.date}</td>
                  <td className="py-3 px-4 text-gray-700 capitalize">{anomaly.metric}</td>
                  <td className="py-3 px-4 font-mono text-gray-900">
                    {anomaly.z_score.toFixed(2)}σ
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {typeof anomaly.value === 'number' ? anomaly.value.toFixed(3) : anomaly.value}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.z_score)}`}>
                      {getSeverityBadge(anomaly.z_score)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 max-w-xs">
                    {anomaly.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
