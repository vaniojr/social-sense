import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  if (numScore <= -1) return '#dc2626'; // red-600
  if (numScore < -0.5) return '#ef4444'; // red-500
  if (numScore < 0) return '#f87171'; // red-400
  if (numScore <= 0.2) return '#fbbf24'; // amber-400
  if (numScore <= 0.5) return '#84cc16'; // lime-500
  return '#22c55e'; // green-500
}

export function BrazilMap({ states, onStateClick, selectedState }: BrazilMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const geoJsonRef = useRef<any>(null);

  const stateMap = states.reduce((acc, state) => {
    acc[state.state_code] = state;
    return acc;
  }, {} as Record<string, StateData>);

  // Load Brazil GeoJSON from local file
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch('/data/brasil-states.json');
        if (!response.ok) throw new Error('Failed to load local GeoJSON');
        const data = await response.json();
        setGeoJsonData(data);
        console.log('✅ GeoJSON loaded from local file');
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGeoJson();
  }, []);

  const onEachFeature = (feature: any, layer: any) => {
    const stateCode = feature.properties?.UF_05;
    const stateData = stateCode ? stateMap[stateCode] : null;

    if (stateData) {
      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-sm">${stateData.state_name} (${stateCode})</h3>
          <p class="text-xs text-gray-600">${stateData.region}</p>
          <p class="text-lg font-bold mt-2">
            <span style="color: ${sentimentToColor(stateData.avg_sentiment)}">
              ${stateData.avg_sentiment}
            </span>
          </p>
          <p class="text-xs">📊 ${stateData.mention_volume.toLocaleString('pt-BR')} menções</p>
          <p class="text-xs font-semibold mt-1">Temas:</p>
          <div class="flex gap-1 flex-wrap mt-1">
            ${stateData.top_themes.slice(0, 3).map(theme => `<span class="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">${theme}</span>`).join('')}
          </div>
        </div>
      `;

      layer.bindPopup(popupContent);

      layer.on('click', () => {
        onStateClick?.(stateCode);
      });

      layer.on('mouseover', () => {
        layer.setStyle({
          opacity: 1,
          weight: 3,
        });
        layer.bringToFront();
      });

      layer.on('mouseout', () => {
        geoJsonRef.current?.resetStyle(layer);
      });
    }
  };

  const style = (feature: any) => {
    const stateCode = feature.properties?.UF_05;
    const stateData = stateCode ? stateMap[stateCode] : null;
    const isSelected = selectedState === stateCode;

    return {
      fillColor: stateData ? sentimentToColor(stateData.avg_sentiment) : '#e5e7eb',
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#2563eb' : '#ffffff',
      dashArray: '',
      fillOpacity: isSelected ? 0.95 : 0.7,
    };
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Mapa de Sentimento por Estado</h3>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-gray-50 rounded">
          <div className="text-gray-500 text-center">
            <div className="animate-spin mb-2">⏳</div>
            Carregando mapa...
          </div>
        </div>
      ) : geoJsonData ? (
        <div className="relative rounded-lg overflow-hidden" style={{ height: '500px' }}>
          <MapContainer
            center={[-10.3, -55.5]}
            zoom={4}
            style={{ width: '100%', height: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              data={geoJsonData}
              style={style}
              onEachFeature={onEachFeature}
              ref={geoJsonRef}
            />
          </MapContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 bg-gray-50 rounded">
          <p className="text-gray-500">Erro ao carregar o mapa</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Escala de Sentimento</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm text-gray-600">Muito Negativo (-1.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f87171' }}></div>
            <span className="text-sm text-gray-600">Negativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
            <span className="text-sm text-gray-600">Neutro (0.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#84cc16' }}></div>
            <span className="text-sm text-gray-600">Positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-sm text-gray-600">Muito Positivo (+1.0)</span>
          </div>
        </div>
      </div>

      {/* Selected State Info */}
      {selectedState && stateMap[selectedState] && (
        <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
          <div className="flex items-between justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {stateMap[selectedState].state_name} ({selectedState})
              </h3>
              <p className="text-sm text-gray-600">{stateMap[selectedState].region}</p>
            </div>
            <div className="text-right">
              <div
                className="text-2xl font-bold"
                style={{ color: sentimentToColor(stateMap[selectedState].avg_sentiment) }}
              >
                {stateMap[selectedState].avg_sentiment}
              </div>
              <p className="text-sm text-gray-600">{stateMap[selectedState].mention_volume.toLocaleString('pt-BR')} menções</p>
            </div>
          </div>
          {stateMap[selectedState].top_themes && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700">Temas principais:</p>
              <div className="flex gap-2 mt-1 flex-wrap">
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
