import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { RealTimeEventsFeed } from '../components/RealTimeEventsFeed';
import { AttackDetectionPanel } from '../components/AttackDetectionPanel';
import { HealthScoreDashboard } from '../components/HealthScoreDashboard';
import { PerformanceMetricsChart } from '../components/PerformanceMetricsChart';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: string;
  suggestedAction: string;
  confidenceScore: number;
}

export function WarRoomDashboard() {
  const { selectedId } = useEntity();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [approving, setApproving] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (selectedId) {
      loadData();
      const interval = setInterval(loadData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedId]);

  const loadData = async () => {
    try {
      // Load recommendations
      const recsResponse = await fetch(
        `${apiUrl}/api/recommendations?entity_id=${selectedId}`
      );
      if (recsResponse.ok) {
        const recsData = await recsResponse.json();
        setRecommendations(recsData.recommendations || []);
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
    }
  };

  const handleApproveRecommendation = async (recId: string) => {
    setApproving(recId);
    try {
      const response = await fetch(
        `${apiUrl}/api/recommendations/${recId}/approve`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        console.log(`✅ Approved recommendation ${recId}`);
        loadData();
      } else {
        console.error('Failed to approve recommendation');
      }
    } catch (err) {
      console.error('❌ Error approving recommendation:', err);
    } finally {
      setApproving(null);
    }
  };

  const handleReviewRecommendation = async (recId: string) => {
    setApproving(recId);
    try {
      const response = await fetch(
        `${apiUrl}/api/recommendations/${recId}/review`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        console.log(`📋 Marked for review: ${recId}`);
        loadData();
      } else {
        console.error('Failed to mark for review');
      }
    } catch (err) {
      console.error('❌ Error marking for review:', err);
    } finally {
      setApproving(null);
    }
  };

  if (!selectedId) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Selecione uma entidade para acessar a War Room</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 War Room - Fase 3</h1>
        <p className="text-gray-600">
          Monitoramento em tempo real, detecção de ataques, análise de performance e recomendações de ação
        </p>
      </div>

      {/* Main grid */}
      <div className="space-y-6">
        {/* Attack Detection - Top priority */}
        <AttackDetectionPanel entityId={selectedId} apiUrl={apiUrl} autoRefresh={10000} />

        {/* Real-time events feed */}
        <RealTimeEventsFeed entityId={selectedId} apiUrl={apiUrl} autoRefresh={5000} />

        {/* Performance Metrics (Bloco K) */}
        <HealthScoreDashboard entityId={selectedId} apiUrl={apiUrl} autoRefresh={30000} />

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Análise de Performance Histórica</h3>
          <PerformanceMetricsChart entityId={selectedId} apiUrl={apiUrl} />
        </div>

        {/* Action Recommendations (Bloco L) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Recomendações de Ação (Bloco L)
          </h3>

          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma recomendação no momento</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-lg border-2 ${
                    rec.priority === 'critical'
                      ? 'border-red-300 bg-red-50'
                      : rec.priority === 'high'
                        ? 'border-orange-300 bg-orange-50'
                        : rec.priority === 'medium'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{rec.title}</span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            rec.priority === 'critical'
                              ? 'bg-red-200 text-red-800'
                              : rec.priority === 'high'
                                ? 'bg-orange-200 text-orange-800'
                                : rec.priority === 'medium'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {rec.priority === 'critical'
                            ? '🔴 Crítico'
                            : rec.priority === 'high'
                              ? '🟠 Alto'
                              : rec.priority === 'medium'
                                ? '🟡 Médio'
                                : '🔵 Baixo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <p className="text-sm mb-3">{rec.suggestedAction}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{ width: `${rec.confidenceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {(rec.confidenceScore * 100).toFixed(0)}% confiança
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApproveRecommendation(rec.id)}
                      disabled={approving === rec.id}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {approving === rec.id ? '⏳' : '✓'} Aprovar Ação
                    </button>
                    <button
                      onClick={() => handleReviewRecommendation(rec.id)}
                      disabled={approving === rec.id}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 disabled:bg-gray-400 transition-colors"
                    >
                      {approving === rec.id ? '⏳' : '📋'} Revisar Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
