interface AlertPreferencesProps {
  preferences: {
    sentiment_drop?: boolean;
    critical_sentiment?: boolean;
    high_volume?: boolean;
  };
  onPreferencesChange: (prefs: any) => void;
}

export function AlertPreferences({ preferences, onPreferencesChange }: AlertPreferencesProps) {
  const togglePreference = (key: string) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key as keyof typeof preferences],
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Preferências de Alertas</h3>
      <p className="text-sm text-gray-600 mb-4">
        Escolha que tipos de alerta deseja receber.
      </p>

      {/* Alert preferences */}
      <div className="space-y-3">
        {/* Sentiment drop alert */}
        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={preferences.sentiment_drop !== false}
            onChange={() => togglePreference('sentiment_drop')}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="ml-3 flex-1">
            <div className="font-semibold text-gray-900">📉 Queda de Sentimento</div>
            <div className="text-sm text-gray-600">
              Alerta quando sentimento cai &gt; 20% em 1 hora
            </div>
          </div>
        </label>

        {/* Critical sentiment alert */}
        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={preferences.critical_sentiment !== false}
            onChange={() => togglePreference('critical_sentiment')}
            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
          />
          <div className="ml-3 flex-1">
            <div className="font-semibold text-gray-900">🚨 Sentimento Crítico</div>
            <div className="text-sm text-gray-600">
              Alerta quando sentimento cai abaixo de -50% em qualquer estado
            </div>
          </div>
        </label>

        {/* High volume alert */}
        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={preferences.high_volume !== false}
            onChange={() => togglePreference('high_volume')}
            className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
          />
          <div className="ml-3 flex-1">
            <div className="font-semibold text-gray-900">📈 Volume Alto</div>
            <div className="text-sm text-gray-600">
              Alerta quando mencões superam 1000 em 1 hora
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
