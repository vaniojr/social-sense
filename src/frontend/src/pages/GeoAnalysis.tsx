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
  const [loading, setLoading] = useState(true);
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
        setStates(data.states);
        setStatistics(data.statistics);
        setSelectedState(undefined); // Reset selected state when candidate changes
      } catch (err) {
        console.error('Error loading regional sentiment:', err);
        setError('Erro ao carregar dados regionais');
      } finally {
        setLoading(false);
      }
    };

    loadRegionalSentiment();
  }, [selectedCandidateId, apiUrl]);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const stateDetails = selectedState ? states.find(s => s.state_code === selectedState) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
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
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Carregando...</option>
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

        {loading ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-lg">
            <div className="text-gray-500">Carregando dados...</div>
          </div>
        ) : (
          <>
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Map Section */}
              <div className="lg:col-span-2">
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
                    <p className="text-sm text-gray-600 mb-1">Candidato selecionado:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedCandidate.name}</p>
                  </div>
                )}

                {statistics && (
                  <>
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-1">Melhor desempenho</p>
                      {statistics.best_state ? (
                        <div>
                          <p className="text-lg font-semibold text-green-600">
                            {statistics.best_state.state_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {statistics.best_state.avg_sentiment}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">-</p>
                      )}
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-1">Pior desempenho</p>
                      {statistics.worst_state ? (
                        <div>
                          <p className="text-lg font-semibold text-red-600">
                            {statistics.worst_state.state_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {statistics.worst_state.avg_sentiment}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">-</p>
                      )}
                    </div>

                    {statistics.average_sentiment !== null && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Sentimento médio nacional</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {statistics.average_sentiment?.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {stateDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Detalhes do estado selecionado:</p>
                    <div className="bg-blue-50 rounded p-3">
                      <p className="font-semibold text-gray-900">{stateDetails.state_name}</p>
                      <p className="text-sm text-gray-600">{stateDetails.region}</p>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                          typeof stateDetails.avg_sentiment === 'number'
                            ? stateDetails.avg_sentiment > 0
                              ? 'bg-green-100 text-green-800'
                              : stateDetails.avg_sentiment < 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {stateDetails.avg_sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ranking Table */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Ranking de Estados</h2>
              <StateRankingTable
                states={states}
                onStateClick={setSelectedState}
                selectedState={selectedState}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
