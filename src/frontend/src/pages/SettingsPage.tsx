import { useEffect, useState } from 'react';
import { useEntity } from '../context/EntityContext';
import { KeywordsManager } from '../components/KeywordsManager';
import { RegionsSelector } from '../components/RegionsSelector';
import { AlertPreferences } from '../components/AlertPreferences';

interface EntityConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  url: string;
  keywords: string[];
  priority_regions: string[];
  alert_preferences: {
    sentiment_drop?: boolean;
    critical_sentiment?: boolean;
    high_volume?: boolean;
  };
}

export function SettingsPage() {
  const { selectedId } = useEntity();
  const [config, setConfig] = useState<EntityConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Load entity config
  useEffect(() => {
    if (!selectedId) return;

    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/entities/${selectedId}/config`);
        if (!response.ok) {
          throw new Error('Erro ao carregar configurações');
        }
        const data = await response.json();
        setConfig(data);
        console.log('✅ Loaded entity config:', data);
      } catch (err) {
        console.error('❌ Error loading config:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [selectedId, apiUrl]);

  const saveSettings = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${apiUrl}/api/entities/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.type,
          url: config.url,
          priority_regions: config.priority_regions,
          alert_preferences: config.alert_preferences,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar configurações');
      }

      setSuccess('✅ Configurações salvas com sucesso!');
      console.log('✅ Settings saved');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedId) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Selecione uma entidade para gerenciar configurações</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Erro ao carregar configurações. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configurações</h1>
        <p className="text-gray-600">Customize seu monitoramento para {config.name}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
          {success}
        </div>
      )}

      {/* Settings sections */}
      <div className="space-y-6 mb-6">
        {/* Entity info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Informações da Entidade</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="politician">Político</option>
                <option value="influencer">Influenciador</option>
                <option value="brand">Marca</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Keywords manager */}
        <KeywordsManager
          keywords={config.keywords}
          entityId={config.id}
          onKeywordsChange={(keywords) => setConfig({ ...config, keywords })}
          apiUrl={apiUrl}
        />

        {/* Regions selector */}
        <RegionsSelector
          selectedRegions={config.priority_regions}
          onRegionsChange={(priority_regions) => setConfig({ ...config, priority_regions })}
        />

        {/* Alert preferences */}
        <AlertPreferences
          preferences={config.alert_preferences}
          onPreferencesChange={(alert_preferences) => setConfig({ ...config, alert_preferences })}
        />
      </div>

      {/* Save button */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
        >
          {saving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
