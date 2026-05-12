import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompetitorComparisonProps {
  groupId: string | null;
  apiUrl: string;
  entities: Array<{ id: string; name: string }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function CompetitorComparison({ groupId, apiUrl, entities }: CompetitorComparisonProps) {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    if (!groupId) return;

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${apiUrl}/api/competitors/sentiment-comparison?groupId=${groupId}&days=${dateRange}`
        );
        if (!response.ok) {
          if (response.status >= 500) {
            console.error('❌ Error fetching comparison: HTTP', response.status);
            setError('Não foi possível carregar os dados');
          }
          setTimelineData([]);
          return;
        }
        const data = await response.json();
        setComparison(data.comparison || {});
        setTimelineData(data.timeline || []);
      } catch (err) {
        console.error('❌ Error fetching comparison:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [groupId, dateRange, apiUrl]);

  if (!groupId) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 flex items-center justify-center h-96">
        <p className="text-gray-500">Selecione um grupo para ver comparação de sentimento</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600">Carregando comparação...</p>
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📈 Comparação de Sentimento</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange(7)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              dateRange === 7
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1 semana
          </button>
          <button
            onClick={() => setDateRange(14)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              dateRange === 14
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            2 semanas
          </button>
          <button
            onClick={() => setDateRange(30)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              dateRange === 30
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      {timelineData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Sem dados disponíveis para este período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              label={{ value: 'Sentimento', angle: -90, position: 'insideLeft' }}
              domain={[-1, 1]}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Volume', angle: 90, position: 'insideRight' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return value;
              }}
              labelFormatter={(label: string) => `Data: ${label}`}
            />
            <Legend />
            {entities
              .filter((entity) => comparison[entity.id])
              .slice(0, 5)
              .map((entity, idx) => (
                <Line
                  key={entity.id}
                  yAxisId={idx % 2 === 0 ? 'left' : 'right'}
                  type="monotone"
                  dataKey={entity.id}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={false}
                  name={entity.name}
                  isAnimationActive={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
