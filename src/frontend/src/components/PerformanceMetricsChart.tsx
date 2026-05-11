import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricData {
  metricName: string;
  stats: {
    current: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    stdDev?: number;
  };
  trend: {
    trend: 'up' | 'down' | 'stable';
    percent: number;
  };
  chartData: Array<{ timestamp: string; value: number }>;
  dataPoints: number;
  slaViolation?: {
    threshold: number;
    severity: 'warning' | 'critical';
  };
}

interface PerformanceMetricsChartProps {
  entityId: string;
  apiUrl: string;
}

const METRIC_CONFIG: Record<string, { label: string; color: string; unit: string; threshold: number }> = {
  response_time: {
    label: 'Tempo de Resposta',
    color: '#3b82f6',
    unit: 'ms',
    threshold: 500,
  },
  error_rate: {
    label: 'Taxa de Erro',
    color: '#ef4444',
    unit: '%',
    threshold: 1.0,
  },
  cpu_usage: {
    label: 'Uso de CPU',
    color: '#f59e0b',
    unit: '%',
    threshold: 80,
  },
  memory_usage: {
    label: 'Uso de Memória',
    color: '#ec4899',
    unit: '%',
    threshold: 85,
  },
  cache_hit_rate: {
    label: 'Taxa de Cache Hit',
    color: '#10b981',
    unit: '%',
    threshold: 70,
  },
  throughput: {
    label: 'Throughput',
    color: '#8b5cf6',
    unit: '/min',
    threshold: 1000,
  },
};

export function PerformanceMetricsChart({ entityId, apiUrl }: PerformanceMetricsChartProps) {
  const [metrics, setMetrics] = useState<Record<string, MetricData | null>>({});
  const [selectedMetric, setSelectedMetric] = useState<string>('response_time');
  const [loading, setLoading] = useState(false);

  const metricNames = Object.keys(METRIC_CONFIG);

  useEffect(() => {
    loadMetrics();
  }, [entityId]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const newMetrics: Record<string, MetricData | null> = {};

      for (const metricName of metricNames) {
        const response = await fetch(
          `${apiUrl}/api/metrics?entityId=${entityId}&metricName=${metricName}&hours=24`
        );

        if (response.ok) {
          const data = await response.json();
          newMetrics[metricName] = data;
        } else {
          newMetrics[metricName] = null;
        }
      }

      setMetrics(newMetrics);
    } catch (err) {
      console.error('❌ Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentData = metrics[selectedMetric];
  const config = METRIC_CONFIG[selectedMetric];

  if (!config) {
    return null;
  }

  const formatValue = (value: number) => {
    return `${value.toFixed(2)}${config.unit}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '→';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Selecionar Métrica
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {metricNames.map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedMetric === metric
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {METRIC_CONFIG[metric].label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric details */}
      {currentData && (
        <div className="space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-xs text-blue-700 font-semibold mb-2">Atual</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatValue(currentData.stats.current)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-xs text-green-700 font-semibold mb-2">Média</div>
              <div className="text-2xl font-bold text-green-900">
                {formatValue(currentData.stats.average)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-xs text-purple-700 font-semibold mb-2">P95</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatValue(currentData.stats.p95)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="text-xs text-orange-700 font-semibold mb-2">
                {currentData.trend.trend === 'up' ? 'Tendência↑' : 'Tendência↓'}
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {getTrendIcon(currentData.trend.trend)} {currentData.trend.percent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* SLA Violation Alert */}
          {currentData.slaViolation && (
            <div
              className={`p-4 rounded-lg border-2 ${
                currentData.slaViolation.severity === 'critical'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{currentData.slaViolation.severity === 'critical' ? '🔴' : '⚠️'}</span>
                <p
                  className={`text-sm font-semibold ${
                    currentData.slaViolation.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
                  }`}
                >
                  SLA Violation: {formatValue(currentData.stats.current)} exceeds threshold
                  {' '}
                  {formatValue(currentData.slaViolation.threshold)}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {currentData.chartData && currentData.chartData.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Histórico (últimas 24h)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={currentData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val: string) => new Date(val).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => formatValue(value)}
                    labelFormatter={(label: string) => new Date(label).toLocaleString('pt-BR')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={config.color}
                    dot={false}
                    name={config.label}
                    isAnimationActive={false}
                  />
                  {/* SLA threshold line */}
                  {currentData.slaViolation && (
                    <Line
                      type="linear"
                      dataKey={() => currentData.slaViolation!.threshold}
                      stroke="#red"
                      strokeDasharray="5 5"
                      dot={false}
                      name={`SLA Threshold (${formatValue(currentData.slaViolation.threshold)})`}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              Sem dados disponíveis para este período
            </div>
          )}

          {/* Detailed stats table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Estatísticas Detalhadas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mínimo:</span>
                <span className="font-mono font-semibold">{formatValue(currentData.stats.min)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mediana:</span>
                <span className="font-mono font-semibold">{formatValue(currentData.stats.median)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Máximo:</span>
                <span className="font-mono font-semibold">{formatValue(currentData.stats.max)}</span>
              </div>
              <div className="border-t border-gray-200 my-2" />
              <div className="flex justify-between">
                <span className="text-gray-600">P99:</span>
                <span className="font-mono font-semibold">{formatValue(currentData.stats.p99)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Desvio Padrão:</span>
                <span className="font-mono font-semibold">{formatValue(currentData.stats.stdDev || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amostras:</span>
                <span className="font-mono font-semibold">{currentData.dataPoints}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 mt-2">Carregando métricas...</p>
        </div>
      )}
    </div>
  );
}
