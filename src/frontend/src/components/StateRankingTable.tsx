interface StateData {
  state_code: string;
  state_name: string;
  region: string;
  avg_sentiment: string | number;
  mention_volume: number;
  top_themes: string[];
  last_updated: string;
}

interface StateRankingTableProps {
  states: StateData[];
  onStateClick?: (stateCode: string) => void;
  selectedState?: string;
}

function getSentimentBadgeColor(sentiment: string | number): string {
  const score = typeof sentiment === 'string' ? parseFloat(sentiment) : sentiment;
  if (score > 0.3) return 'bg-green-100 text-green-800';
  if (score > 0) return 'bg-lime-100 text-lime-800';
  if (score === 0) return 'bg-yellow-100 text-yellow-800';
  if (score > -0.3) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

function getSentimentIcon(sentiment: string | number): string {
  const score = typeof sentiment === 'string' ? parseFloat(sentiment) : sentiment;
  if (score > 0) return '📈';
  if (score < 0) return '📉';
  return '➡️';
}

export function StateRankingTable({ states, onStateClick, selectedState }: StateRankingTableProps) {
  const sortedStates = [...states].sort((a, b) => {
    const scoreA = typeof a.avg_sentiment === 'string' ? parseFloat(a.avg_sentiment) : a.avg_sentiment;
    const scoreB = typeof b.avg_sentiment === 'string' ? parseFloat(b.avg_sentiment) : b.avg_sentiment;
    return scoreB - scoreA;
  });

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Região</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Sentimento</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Menções</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Temas Principais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedStates.map((state, index) => (
              <tr
                key={`state-${index}`}
                onClick={() => onStateClick && onStateClick(state.state_code)}
                className={`cursor-pointer transition-colors ${
                  selectedState === state.state_code
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {state.state_name} ({state.state_code})
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{state.region}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getSentimentBadgeColor(state.avg_sentiment)}`}>
                      {getSentimentIcon(state.avg_sentiment)} {state.avg_sentiment}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-600">
                  {state.mention_volume.toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {state.top_themes.slice(0, 3).map(theme => (
                      <span key={theme} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {theme}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
