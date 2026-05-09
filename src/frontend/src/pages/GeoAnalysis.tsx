import { useEffect, useState } from 'react';
import { BrazilMap } from '../components/BrazilMap';
import { StateRankingTable } from '../components/StateRankingTable';

interface Candidate {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface StateData {
  state_code: string;
  state_name: string;
  region: string;
  avg_sentiment: string | number;
  mention_volume: number;
  top_themes: string[];
  last_updated: string;
  candidate_name?: string;
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

export function GeoAnalysis() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<RegionalSentimentResponse['statistics'] | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Load candidates on mount
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/candidates`);
        if (!response.ok) throw new Error('Failed to load candidates');
        const data = await response.json();
        setCandidates(data);
        if (data.length > 0) {
          setSelectedCandidateId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading candidates:', err);
        setError('Erro ao carregar candidatos');
      } finally {
        setLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, [apiUrl]);

  // Load regional sentiment data when candidate changes
  useEffect(() => {
    if (!selectedCandidateId) return;

    const loadRegionalSentiment = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = selectedCandidateId
          ? `${apiUrl}/api/geo/regional-sentiment?candidateId=${selectedCandidateId}`
          : `${apiUrl}/api/geo/regional-sentiment`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load regional sentiment');
        const data: RegionalSentimentResponse = await response.json();
        setStates(data.states || []);
        setStatistics(data.statistics || null);
        setSelectedState(undefined);
      } catch (err) {
        console.error('Error loading regional sentiment:', err);
        setError('Erro ao carregar dados regionais');
        setStates([]);
      } finally {
        setLoading(false);
      }
    };

    loadRegionalSentiment();
  }, [selectedCandidateId, apiUrl]);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const stateDetails = selectedState ? states.find(s => s.state_code === selectedState) : null;

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🗺️ Análise Geográfica</h1>
          <p className="text-gray-600">Visualize o sentimento por região e estado brasileiro</p>
        </div>

        {/* Candidate Selector */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecione um candidato:</label>
          <select
            value={selectedCandidateId}
            onChange={e => setSelectedCandidateId(e.target.value)}
            disabled={loadingCandidates}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            {loadingCandidates && <option>Carregando...</option>}
            {candidates.map(candidate => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} ({candidate.category})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg">
            <div className="text-gray-500 text-center">
              <div className="animate-spin mb-2">⏳</div>
              Carregando dados...
            </div>
          </div>
        )}

        {!loading && states.length > 0 && (
          <>
            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Map Section - Wider on desktop */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <BrazilMap
                  states={states}
                  onStateClick={setSelectedState}
                  selectedState={selectedState}
                />
              </div>

              {/* Statistics Panel */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Estatísticas</h2>

                {selectedCandidate && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Candidato:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedCandidate.name}</p>
                    <p className="text-xs text-gray-500">{selectedCandidate.category}</p>
                  </div>
                )}

                {statistics && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Melhor estado</p>
                      {statistics.best_state ? (
                        <div className="bg-green-50 rounded p-3 border border-green-200">
                          <p className="font-semibold text-green-900">{statistics.best_state.state_name}</p>
                          <p className="text-2xl font-bold text-green-600">{statistics.best_state.avg_sentiment}</p>
                        </div>
                      ) : (
                        <p className="text-gray-400">-</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Pior estado</p>
                      {statistics.worst_state ? (
                        <div className="bg-red-50 rounded p-3 border border-red-200">
                          <p className="font-semibold text-red-900">{statistics.worst_state.state_name}</p>
                          <p className="text-2xl font-bold text-red-600">{statistics.worst_state.avg_sentiment}</p>
                        </div>
                      ) : (
                        <p className="text-gray-400">-</p>
                      )}
                    </div>
                  </div>
                )}

                {stateDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3 font-semibold">Estado Selecionado</p>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="font-bold text-lg text-gray-900">{stateDetails.state_name} ({stateDetails.state_code})</p>
                      <p className="text-sm text-gray-600 mb-3">{stateDetails.region}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Sentimento:</span>
                        <span className={`text-2xl font-bold ${
                          (stateDetails.avg_sentiment as number) > 0 ? 'text-green-600' :
                          (stateDetails.avg_sentiment as number) < 0 ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {stateDetails.avg_sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{stateDetails.mention_volume} menções</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ranking Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Ranking de Estados</h2>
              <StateRankingTable
                states={states}
                onStateClick={setSelectedState}
                selectedState={selectedState}
              />
            </div>
          </>
        )}

        {!loading && states.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Nenhum dado disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}
