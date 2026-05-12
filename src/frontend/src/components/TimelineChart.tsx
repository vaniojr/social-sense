import { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TimelinePoint {
  date: string;
  sentiment_avg: number;
  volume: number;
}

interface TimelineChartProps {
  entityId: string;
  apiUrl: string;
  days: number;
}

export function TimelineChart({ entityId, apiUrl, days }: TimelineChartProps) {
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [entityId, days]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/trends/timeline?entity_id=${entityId}&days=${days}`);
      if (!response.ok) throw new Error('Erro ao carregar timeline');
      const result = await response.json();
      setData(result.timeline || []);
    } catch (err) {
      console.error('❌ Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600">Carregando timeline...</p>
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Timeline de Sentimento e Volume</h3>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Sem dados disponíveis para este período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
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
              label={{ value: 'Volume de Menções', angle: 90, position: 'insideRight' }}
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
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sentiment_avg"
              stroke="#3b82f6"
              dot={false}
              name="Sentimento"
              isAnimationActive={false}
            />
            <Bar
              yAxisId="right"
              dataKey="volume"
              fill="#93c5fd"
              name="Volume"
              opacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
