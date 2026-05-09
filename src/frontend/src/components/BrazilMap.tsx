import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

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

const BRAZIL_GEOJSON_URL = 'https://raw.githubusercontent.com/fititnt/gis-dataset-brasil/master/uf/geojson/uf.json';

// Color scale: -1 (red) → 0 (yellow) → +1 (green)
function sentimentToColor(score: number | string): string {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (numScore <= -1) return '#ef4444'; // deep red
  if (numScore < 0) return '#f87171'; // light red
  if (numScore <= 0.2) return '#eab308'; // yellow
  if (numScore <= 0.5) return '#84cc16'; // light green
  return '#22c55e'; // green
}

export function BrazilMap({ states, onStateClick, selectedState }: BrazilMapProps) {
  const [geographies, setGeographies] = useState<any>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  useEffect(() => {
    fetch(BRAZIL_GEOJSON_URL)
      .then(res => res.json())
      .then(data => setGeographies(data.features))
      .catch(err => console.error('Error loading Brazil GeoJSON:', err));
  }, []);

  const stateMap = states.reduce((acc, state) => {
    acc[state.state_code] = state;
    return acc;
  }, {} as Record<string, StateData>);

  if (!geographies) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500">Carregando mapa...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow">
      <ComposableMap projection="mercator" projectionConfig={{ scale: 2500, center: [-52, -12] }}>
        <Geographies geography={geographies}>
          {({ geographies }) =>
            geographies.map((geo: any) => {
              const stateCode = geo.properties.SIGLA_UF || geo.properties.UF_CODE || '';
              const stateData = stateMap[stateCode];
              const isSelected = selectedState === stateCode;
              const isHovered = hoveredState === stateCode;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (onStateClick) {
                      onStateClick(stateCode);
                    }
                  }}
                  onMouseEnter={() => setHoveredState(stateCode)}
                  onMouseLeave={() => setHoveredState(null)}
                  style={{
                    default: {
                      fill: stateData ? sentimentToColor(stateData.avg_sentiment) : '#d1d5db',
                      stroke: isSelected ? '#1f2937' : '#fff',
                      strokeWidth: isSelected ? 2 : 0.75,
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                    },
                    hover: {
                      fill: stateData ? sentimentToColor(stateData.avg_sentiment) : '#d1d5db',
                      stroke: '#000',
                      strokeWidth: 1.5,
                      outline: 'none',
                      cursor: 'pointer',
                      filter: 'brightness(1.2)',
                    },
                    pressed: {
                      fill: stateData ? sentimentToColor(stateData.avg_sentiment) : '#d1d5db',
                      stroke: '#1f2937',
                      strokeWidth: 2,
                      outline: 'none',
                      cursor: 'pointer',
                    },
                  }}
                >
                  {stateData && (isHovered || isSelected) && (
                    <title>{`${stateData.state_name}: ${stateData.avg_sentiment} | ${stateData.mention_volume} menções`}</title>
                  )}
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">Escala de Sentimento</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Muito Negativo (-1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-gray-600">Neutro (0.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Muito Positivo (+1.0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected state details */}
      {selectedState && stateMap[selectedState] && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
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
