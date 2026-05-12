import { useState, useEffect } from 'react';

interface AttackStatus {
  severity: number;
  isImminent: boolean;
  isOngoing: boolean;
  indicators: any[];
  eventCount: number;
  criticalCount: number;
}

interface AttackDetectionPanelProps {
  entityId: string;
  apiUrl: string;
  autoRefresh?: number;
}

export function AttackDetectionPanel({
  entityId,
  apiUrl,
  autoRefresh = 10000,
}: AttackDetectionPanelProps) {
  const [status, setStatus] = useState<AttackStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    loadAttackStatus();
    const interval = setInterval(loadAttackStatus, autoRefresh);
    return () => clearInterval(interval);
  }, [entityId]);

  const loadAttackStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/attacks?entityId=${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('❌ Error loading attack status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return null;
  }

  const getSeverityLevel = (severity: number): string => {
    if (severity > 80) return '🚨 CRÍTICO';
    if (severity > 70) return '⚠️ IMINENTE';
    if (severity > 50) return '🟠 MODERADO';
    return '🟢 NORMAL';
  };

  const getSeverityColor = (severity: number): string => {
    if (severity > 80) return 'bg-red-50 border-red-300';
    if (severity > 70) return 'bg-orange-50 border-orange-300';
    if (severity > 50) return 'bg-yellow-50 border-yellow-300';
    return 'bg-green-50 border-green-300';
  };

  const getSeverityTextColor = (severity: number): string => {
    if (severity > 80) return 'text-red-900';
    if (severity > 70) return 'text-orange-900';
    if (severity > 50) return 'text-yellow-900';
    return 'text-green-900';
  };

  // Show alert if attack is ongoing or imminent and not dismissed
  const showAlert = (status.isOngoing || status.isImminent) && !alertDismissed;

  return (
    <div
      className={`rounded-lg border-2 p-6 transition-all ${getSeverityColor(
        status.severity
      )}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">
            {status.severity > 80 ? '🚨' : status.severity > 70 ? '⚠️' : '🛡️'}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${getSeverityTextColor(status.severity)}`}>
              Detecção de Ataque Coordenado
            </h3>
            <p className={`text-sm ${getSeverityTextColor(status.severity)}`}>
              {getSeverityLevel(status.severity)}
            </p>
          </div>
        </div>
        <button
          onClick={loadAttackStatus}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {/* Alert banner */}
      {showAlert && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-red-900 mb-1">
                {status.isOngoing ? '🚨 ATAQUE EM ANDAMENTO' : '⚠️ ATAQUE IMINENTE'}
              </p>
              <p className="text-sm text-red-800">
                {status.isOngoing
                  ? 'Múltiplos indicadores de ataque coordenado detectados. Ação recomendada.'
                  : 'Padrões suspeitos detectados. Prepare-se para possível ataque.'}
              </p>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="ml-3 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Severidade</div>
          <div className="text-2xl font-bold">{Math.round(Number(status.severity))}/100</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                Number(status.severity) > 80
                  ? 'bg-red-600'
                  : Number(status.severity) > 70
                    ? 'bg-orange-600'
                    : Number(status.severity) > 50
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(100, Number(status.severity))}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Eventos Críticos</div>
          <div className="text-2xl font-bold">{status.criticalCount}</div>
          <div className="text-xs text-gray-500 mt-2">últimas 24h</div>
        </div>

        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Total de Eventos</div>
          <div className="text-2xl font-bold">{status.eventCount}</div>
          <div className="text-xs text-gray-500 mt-2">últimas 24h</div>
        </div>
      </div>

      {/* Indicators */}
      {status.indicators && status.indicators.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <h4 className={`text-sm font-semibold mb-3 ${getSeverityTextColor(status.severity)}`}>
            Indicadores Detectados
          </h4>
          <div className="space-y-2">
            {status.indicators.map((indicator: any, idx: number) => (
              <div key={idx} className="bg-white bg-opacity-50 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{indicator.type}</span>
                  <span className="text-xs">
                    {(indicator.confidence * 100).toFixed(0)}% confiança
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div
                    className="h-1 rounded-full bg-blue-600"
                    style={{ width: `${indicator.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div
          className={`w-3 h-3 rounded-full animate-pulse ${
            status.isOngoing
              ? 'bg-red-600'
              : status.isImminent
                ? 'bg-orange-600'
                : 'bg-green-600'
          }`}
        />
        <span className="text-xs font-semibold">
          {status.isOngoing ? 'Monitorando ataque ativo' : status.isImminent ? 'Preparando defesa' : 'Sistema seguro'}
        </span>
      </div>
    </div>
  );
}
