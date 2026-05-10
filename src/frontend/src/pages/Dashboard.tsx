import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEntity } from '../context/EntityContext';

interface StateData {
  state_code: string;
  state_name: string;
  region: string;
  avg_sentiment: string | number;
  mention_volume: number;
  top_themes: string[];
  last_updated: string;
}

interface RegionalSentimentResponse {
  states: StateData[];
  total_states: number;
  statistics: {
    best_state: StateData | null;
    worst_state: StateData | null;
    average_sentiment: number | null;
  };
  timestamp: string;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  alert_type: string;
  triggered_at: string;
  is_active: boolean;
}

function sentimentToColor(score: number | string): string {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (numScore <= -1) return '#dc2626';
  if (numScore < -0.5) return '#ef4444';
  if (numScore < 0) return '#f87171';
  if (numScore <= 0.2) return '#fbbf24';
  if (numScore <= 0.5) return '#84cc16';
  return '#22c55e';
}

export function Dashboard() {
  const { selectedId, selected } = useEntity();
  const [data, setData] = useState<RegionalSentimentResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/fititnt/gis-dataset-brasil/master/uf/geojson/uf.json'
        );
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      }
    };

    loadGeoJson();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const url = `${apiUrl}/api/geo/regional-sentiment?entityId=${selectedId}`;
        console.log('📊 Dashboard: Fetching sentiment data from:', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load data');
        const result = await response.json();
        console.log('✅ Dashboard: Data loaded successfully', {
          statesCount: result.states?.length,
          hasTimestamp: !!result.timestamp,
          firstState: result.states?.[0]
        });
        setData(result);

        // Fetch alerts
        const alertsUrl = `${apiUrl}/api/alerts?entityId=${selectedId}&limit=5`;
        const alertsResponse = await fetch(alertsUrl);
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData.alerts || []);
          console.log('✅ Dashboard: Alerts loaded', { count: alertsData.alerts?.length || 0 });
        }
      } catch (error) {
        console.error('❌ Dashboard: Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedId, apiUrl]);

  const topBest = data?.states?.slice(0, 5) || [];
  const topWorst = data?.states?.slice(-5).reverse() || [];

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            📊 Resumo Executivo
          </h1>
          <p className="text-gray-600">
            {selected ? `${selected.name} • ${selected.type}` : 'Selecione uma entidade'}
            {data && (
              <span className="text-xs text-gray-400 ml-3">
                Atualizado em {new Date(data.timestamp).toLocaleTimeString('pt-BR')}
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-lg">
            <div className="text-gray-500 text-center">
              <div className="animate-spin mb-2 text-2xl">⏳</div>
              Carregando dados...
            </div>
          </div>
        ) : data ? (
          <>
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Sentimento Médio */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Sentimento Médio</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.statistics.average_sentiment?.toFixed(2) || '—'}
                    </p>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>

              {/* Total Menções */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Menções</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(
                        data.states.reduce((sum, s) => sum + s.mention_volume, 0) / 1000
                      ).toFixed(1)}
                      k
                    </p>
                  </div>
                  <div className="text-4xl">💬</div>
                </div>
              </div>

              {/* Melhor Estado */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Melhor Estado</p>
                {data.statistics.best_state ? (
                  <div>
                    <p className="text-2xl font-bold text-green-600 mb-1">
                      {data.statistics.best_state.state_code}
                    </p>
                    <p className="text-xs text-gray-600">
                      {data.statistics.best_state.state_name}
                    </p>
                    <p className="text-sm font-semibold text-green-700 mt-1">
                      {data.statistics.best_state.avg_sentiment}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400">—</p>
                )}
              </div>

              {/* Pior Estado */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Pior Estado</p>
                {data.statistics.worst_state ? (
                  <div>
                    <p className="text-2xl font-bold text-red-600 mb-1">
                      {data.statistics.worst_state.state_code}
                    </p>
                    <p className="text-xs text-gray-600">
                      {data.statistics.worst_state.state_name}
                    </p>
                    <p className="text-sm font-semibold text-red-700 mt-1">
                      {data.statistics.worst_state.avg_sentiment}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400">—</p>
                )}
              </div>
            </div>

            {/* Mini Map + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Mini Map */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Mapa de Sentimento</h2>
                {geoJsonData ? (
                  <div className="relative rounded-lg overflow-hidden" style={{ height: '300px' }}>
                    <MapContainer
                      center={[-10.3, -55.5]}
                      zoom={4}
                      style={{ width: '100%', height: '100%' }}
                      className="rounded-lg"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {data && geoJsonData && (
                        <GeoJSON
                          key={`geojson-${data.timestamp}`}
                          data={geoJsonData}
                          style={(feature: any) => {
                            const code = feature.properties?.UF_05;
                            const state = data.states?.find(s => s.state_code === code);
                            const color = state ? sentimentToColor(state.avg_sentiment) : '#e5e7eb';
                            if (state) console.log(`🎨 Styling state ${code}: ${state?.state_name} = ${color}`);
                            return {
                              fillColor: color,
                              weight: 1,
                              opacity: 1,
                              color: '#ffffff',
                              fillOpacity: 0.7,
                            };
                          }}
                          onEachFeature={(feature: any, layer: any) => {
                            const code = feature.properties?.UF_05;
                            const state = data.states?.find(s => s.state_code === code);
                            if (state) {
                              layer.bindPopup(`
                                <div class="p-2">
                                  <h3 class="font-bold text-sm">${state.state_name} (${code})</h3>
                                  <p class="text-lg font-bold" style="color: ${sentimentToColor(state.avg_sentiment)}">
                                    ${state.avg_sentiment}
                                  </p>
                                  <p class="text-xs">📊 ${state.mention_volume.toLocaleString('pt-BR')} menções</p>
                                </div>
                              `);
                            }
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
                    <p className="text-gray-400">Carregando mapa...</p>
                  </div>
                )}
                <Link
                  to="/geo"
                  className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Ver análise completa →
                </Link>
              </div>

              {/* Alerts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🔔 Alertas Recentes</h2>
                <div className="space-y-3">
                  {alerts.length > 0 ? (
                    alerts.map(alert => (
                      <div key={alert.id} className="pb-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">
                            {alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(alert.triggered_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Nenhum alerta</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top 5 Best + Worst */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 Melhores */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">⬆️ Top 5 Melhores Estados</h2>
                <div className="space-y-2">
                  {topBest.map((state, idx) => (
                    <div key={state.state_code} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <span className="font-bold text-gray-400 w-6">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {state.state_name} ({state.state_code})
                        </p>
                        <p className="text-xs text-gray-500">{state.region}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-sm font-bold text-green-800 bg-green-100">
                        {state.avg_sentiment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Piores */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">⬇️ Top 5 Piores Estados</h2>
                <div className="space-y-2">
                  {topWorst.map((state, idx) => (
                    <div key={state.state_code} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <span className="font-bold text-gray-400 w-6">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {state.state_name} ({state.state_code})
                        </p>
                        <p className="text-xs text-gray-500">{state.region}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-sm font-bold text-red-800 bg-red-100">
                        {state.avg_sentiment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Nenhum dado disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}
