import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketShareWidget {
  groupId: string | null;
  apiUrl: string;
}

interface MarketShare {
  entity_id: string;
  name: string;
  volume: number;
  pct: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function MarketShareWidget({ groupId, apiUrl }: MarketShareWidget) {
  const [marketShare, setMarketShare] = useState<MarketShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setMarketShare([]);
      return;
    }

    const fetchMarketShare = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/api/competitors/market-share?groupId=${groupId}`);
        if (!response.ok) {
          console.error('❌ Error fetching market share: HTTP', response.status);
          setError('Não foi possível carregar os dados');
          setMarketShare([]);
          return;
        }
        const data = await response.json();
        setMarketShare(data.market_share || []);
      } catch (err) {
        console.error('❌ Error fetching market share:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketShare();
  }, [groupId, apiUrl]);

  if (!groupId) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 flex items-center justify-center h-96">
        <p className="text-gray-500">Selecione um grupo para ver participação de mercado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600">Carregando participação...</p>
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

  const chartData = marketShare.map(m => ({
    name: m.name,
    value: m.pct,
    volume: m.volume,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Participação de Mercado</h3>

      {marketShare.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Sem dados disponíveis
        </div>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {marketShare.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label: any) => label}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Volume breakdown table */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Volume de Menções</h4>
            <div className="space-y-2">
              {marketShare.map((item) => (
                <div key={item.entity_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[marketShare.indexOf(item) % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.volume} ({(item.pct * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
