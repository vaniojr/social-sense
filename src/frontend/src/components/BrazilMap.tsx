interface StateData {
  state_code: string;
  state_name: string;
  region: string;
  avg_sentiment: string | number;
  mention_volume: number;
  top_themes: string[];
  last_updated: string;
}

interface BrazilMapProps {
  states: StateData[];
  onStateClick?: (stateCode: string) => void;
  selectedState?: string;
}

// Color scale: -1 (red) → 0 (yellow) → +1 (green)
function sentimentToColor(score: number | string): string {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (numScore <= -1) return 'bg-red-600';
  if (numScore < 0) return 'bg-red-400';
  if (numScore <= 0.2) return 'bg-yellow-400';
  if (numScore <= 0.5) return 'bg-lime-400';
  return 'bg-green-500';
}

function sentimentToBgStyle(score: number | string): string {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (numScore <= -1) return 'bg-red-50 hover:bg-red-100';
  if (numScore < 0) return 'bg-red-50 hover:bg-red-100';
  if (numScore <= 0.2) return 'bg-yellow-50 hover:bg-yellow-100';
  if (numScore <= 0.5) return 'bg-lime-50 hover:bg-lime-100';
  return 'bg-green-50 hover:bg-green-100';
}

export function BrazilMap({ states, onStateClick, selectedState }: BrazilMapProps) {
  const stateMap = states.reduce((acc, state) => {
    acc[state.state_code] = state;
    return acc;
  }, {} as Record<string, StateData>);

  // Brazilian states organized by region
  const regions = {
    'Northeast': ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'],
    'North': ['PA', 'AM', 'RR', 'AP', 'AC', 'RO', 'TO'],
    'Center-West': ['MT', 'MS', 'GO', 'DF'],
    'Southeast': ['SP', 'RJ', 'ES', 'MG'],
    'South': ['PR', 'SC', 'RS'],
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Mapa de Sentimento por Estado</h3>

      <div className="space-y-6">
        {Object.entries(regions).map(([region, codes]) => (
          <div key={region}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{region}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {codes.map(code => {
                const stateData = stateMap[code];
                const isSelected = selectedState === code;
                return (
                  <button
                    key={code}
                    onClick={() => onStateClick && onStateClick(code)}
                    title={stateData ? `${stateData.state_name}: ${stateData.avg_sentiment}` : code}
                    className={`
                      p-3 rounded-lg border-2 transition-all cursor-pointer text-sm font-semibold
                      ${isSelected ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-400'}
                      ${stateData ? sentimentToBgStyle(stateData.avg_sentiment) : 'bg-gray-100 hover:bg-gray-200'}
                    `}
                  >
                    <div className="text-xs text-gray-600">{code}</div>
                    {stateData && (
                      <div className="text-lg font-bold text-gray-900">{stateData.avg_sentiment}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Escala de Sentimento</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded"></div>
            <span className="text-sm text-gray-600">Muito Negativo (-1.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-400 rounded"></div>
            <span className="text-sm text-gray-600">Negativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
            <span className="text-sm text-gray-600">Neutro (0.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-lime-400 rounded"></div>
            <span className="text-sm text-gray-600">Positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Muito Positivo (+1.0)</span>
          </div>
        </div>
      </div>

      {/* Selected state details */}
      {selectedState && stateMap[selectedState] && (
        <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <div className="flex items-between justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {stateMap[selectedState].state_name} ({selectedState})
              </h3>
              <p className="text-sm text-gray-600">{stateMap[selectedState].region}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                (stateMap[selectedState].avg_sentiment as number) > 0 ? 'text-green-600' :
                (stateMap[selectedState].avg_sentiment as number) < 0 ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {stateMap[selectedState].avg_sentiment}
              </div>
              <p className="text-sm text-gray-600">{stateMap[selectedState].mention_volume} menções</p>
            </div>
          </div>
          {stateMap[selectedState].top_themes && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700">Temas principais:</p>
              <div className="flex gap-2 mt-1">
                {stateMap[selectedState].top_themes.map(theme => (
                  <span key={theme} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
