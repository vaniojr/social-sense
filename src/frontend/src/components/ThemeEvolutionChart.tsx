import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Theme {
  name: string;
  volume_timeline: Array<{ date: string; volume: number }>;
  sentiment_timeline: Array<{ date: string; sentiment: number }>;
  trend: 'rising' | 'falling' | 'stable';
  first_appeared: string;
}

interface ThemeEvolutionChartProps {
  entityId: string;
  apiUrl: string;
  days: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function ThemeEvolutionChart({ entityId, apiUrl, days }: ThemeEvolutionChartProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, [entityId, days]);

  const fetchThemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/trends/theme-evolution?entityId=${entityId}&days=${days}`);
      if (!response.ok) throw new Error('Erro ao carregar temas');
      const result = await response.json();
      setThemes(result.themes || []);
      if (result.themes && result.themes.length > 0) {
        setSelectedTheme(result.themes[0].name);
      }
    } catch (err) {
      console.error('❌ Error fetching themes:', err);
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
          <p className="text-gray-600">Carregando evolução de temas...</p>
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

  if (themes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center h-96">
        <p className="text-gray-500">Nenhum tema detectado neste período</p>
      </div>
    );
  }

  // Build chart data from selected theme volumes
  const selectedThemeObj = themes.find(t => t.name === selectedTheme);
  const chartData = selectedThemeObj?.volume_timeline || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🎨 Evolução de Temas</h3>
        <select
          value={selectedTheme || ''}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
        >
          {themes.map(theme => (
            <option key={theme.name} value={theme.name}>
              {theme.name} ({theme.trend === 'rising' ? '📈' : theme.trend === 'falling' ? '📉' : '→'})
            </option>
          ))}
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Sem dados para este tema
        </div>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => (typeof value === 'number' ? value.toFixed(0) : value)}
                labelFormatter={(label: string) => `Data: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                fill="#93c5fd"
                name="Menções"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Theme list */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Temas Detectados ({themes.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {themes.map((theme, idx) => (
                <div
                  key={theme.name}
                  onClick={() => setSelectedTheme(theme.name)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTheme === theme.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-semibold text-gray-900">{theme.name}</span>
                        <span className="text-xs text-gray-500">
                          {theme.trend === 'rising' ? '📈' : theme.trend === 'falling' ? '📉' : '→'} {theme.trend}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Detectado em {theme.first_appeared}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
