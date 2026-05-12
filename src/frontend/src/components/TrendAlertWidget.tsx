import { useState, useEffect } from 'react';

interface TrendAlert {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  detected_at: string;
  is_dismissed: boolean;
}

interface TrendAlertWidgetProps {
  entityId: string;
  apiUrl: string;
}

export function TrendAlertWidget({ entityId, apiUrl }: TrendAlertWidgetProps) {
  const [alerts, setAlerts] = useState<TrendAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/trends/alerts?entityId=${entityId}`);
        if (!response.ok) throw new Error('Erro ao carregar alertas');
        const data = await response.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error('❌ Error fetching alerts:', err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [entityId, apiUrl]);

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/trends/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (err) {
      console.error('❌ Error dismissing alert:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300';
      case 'high':
        return 'bg-orange-100 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-green-100 border-green-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emerging_trend':
        return '🌟';
      case 'reversal':
        return '↩️';
      case 'acceleration':
        return '⚡';
      default:
        return '⚠️';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Alertas Recentes</h3>

      {alerts.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Nenhum alerta no momento
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getAlertIcon(alert.alert_type)}</span>
                  <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                </div>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Descartar"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {alert.alert_type === 'emerging_trend' && 'Nova Tendência'}
                {alert.alert_type === 'reversal' && 'Reversão'}
                {alert.alert_type === 'acceleration' && 'Aceleração'}
              </p>
              <p className="text-xs text-gray-700 mb-2">{alert.description}</p>
              <p className="text-xs text-gray-500">{formatDate(alert.detected_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
