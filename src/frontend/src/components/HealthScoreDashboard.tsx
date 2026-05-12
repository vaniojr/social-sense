import { useState, useEffect } from 'react';

interface HealthData {
  healthScore: number;
  healthStatus: {
    status: string;
    color: string;
    icon: string;
  };
  violations: number;
  metrics: Array<{
    name: string;
    current: number;
    threshold: number | null;
    violation: boolean;
  }>;
  timestamp: string;
}

interface HealthScoreDashboardProps {
  entityId: string;
  apiUrl: string;
  autoRefresh?: number;
}

export function HealthScoreDashboard({
  entityId,
  apiUrl,
  autoRefresh = 30000,
}: HealthScoreDashboardProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, autoRefresh);
    return () => clearInterval(interval);
  }, [entityId]);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/health-score?entity_id=${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setHistory(prev => [...prev.slice(-23), data.healthScore]); // Keep last 24 readings
      }
    } catch (err) {
      console.error('❌ Error loading health score:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!health) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 95) return 'from-green-400 to-green-600';
    if (score >= 80) return 'from-blue-400 to-blue-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    if (score >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 95) return 'bg-green-50 border-green-300';
    if (score >= 80) return 'bg-blue-50 border-blue-300';
    if (score >= 60) return 'bg-yellow-50 border-yellow-300';
    if (score >= 40) return 'bg-orange-50 border-orange-300';
    return 'bg-red-50 border-red-300';
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getScoreBgColor(health.healthScore)}`}>
      {/* Main score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex-shrink-0">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreColor(
              health.healthScore
            )} flex items-center justify-center`}
          >
            <div className="text-white text-center">
              <div className="text-4xl font-bold">{Math.round(health.healthScore)}</div>
              <div className="text-xs font-semibold mt-1">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {health.healthStatus.icon} Sistema {health.healthStatus.status}
          </h2>
          <p className="text-gray-700 mb-4">
            {health.healthScore >= 95
              ? 'Todos os sistemas funcionando normalmente'
              : health.healthScore >= 80
                ? 'Sistema operando bem, monitorar métricas'
                : health.healthScore >= 60
                  ? 'Algumas métricas acima do ideal, ação recomendada'
                  : health.healthScore >= 40
                    ? 'Múltiplas violações de SLA, intervenção necessária'
                    : 'Sistema crítico, ação imediata necessária'}
          </p>

          {health.violations > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                🚨 {health.violations} violação{health.violations > 1 ? 's' : ''} de SLA
              </span>
            </div>
          )}
        </div>

        <button
          onClick={loadHealth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>

      {/* Metrics grid */}
      <div className="mt-6 pt-6 border-t border-current border-opacity-20">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Métricas</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {health.metrics.map(metric => (
            <div
              key={metric.name}
              className={`p-3 rounded-lg border ${
                metric.violation
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-900">
                  {metric.name.replace(/_/g, ' ')}
                </span>
                {metric.violation && (
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                    ⚠️ Violation
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {metric.current.toFixed(2)}
                </span>
                {metric.threshold && (
                  <span className="text-xs text-gray-600">
                    (limite: {metric.threshold.toFixed(2)})
                  </span>
                )}
              </div>

              {metric.violation && metric.threshold && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-red-600"
                    style={{
                      width: `${Math.min(100, (metric.current / metric.threshold) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* History sparkline */}
      {history.length > 1 && (
        <div className="mt-6 pt-6 border-t border-current border-opacity-20">
          <h3 className="text-xs font-semibold text-gray-900 mb-3">Histórico (últimas 24 leituras)</h3>
          <div className="flex items-end gap-1 h-16">
            {history.map((score, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-t bg-blue-400 hover:bg-blue-600 transition-colors"
                style={{
                  height: `${Math.max(4, (score / 100) * 100)}%`,
                }}
                title={`${score.toFixed(0)}/100`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-600 text-right">
        Última atualização: {new Date(health.timestamp).toLocaleTimeString('pt-BR')}
      </div>
    </div>
  );
}
