import { useState } from 'react';

interface KeywordsManagerProps {
  keywords: string[];
  entityId: string;
  onKeywordsChange: (keywords: string[]) => void;
  apiUrl: string;
}

export function KeywordsManager({
  keywords,
  entityId,
  onKeywordsChange,
  apiUrl,
}: KeywordsManagerProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addKeyword = async () => {
    if (!newKeyword.trim()) {
      setError('Keyword não pode estar vazio');
      return;
    }

    if (keywords.includes(newKeyword.trim())) {
      setError('Keyword já existe');
      return;
    }

    if (keywords.length >= 100) {
      setError('Máximo de 100 keywords atingido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/entities/${entityId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao adicionar keyword');
      }

      onKeywordsChange([...keywords, newKeyword.trim()]);
      setNewKeyword('');
      console.log(`✅ Keyword "${newKeyword}" adicionada`);
    } catch (err) {
      console.error('❌ Error adding keyword:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar keyword');
    } finally {
      setLoading(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/api/entities/${entityId}/keywords/${encodeURIComponent(keyword)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao remover keyword');
      }

      onKeywordsChange(keywords.filter((k) => k !== keyword));
      console.log(`✅ Keyword "${keyword}" removida`);
    } catch (err) {
      console.error('❌ Error removing keyword:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover keyword');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Temas de Interesse</h3>
      <p className="text-sm text-gray-600 mb-4">
        Adicione temas que deseja monitorar. Máximo 100 keywords.
      </p>

      {/* Input area */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && addKeyword()}
          placeholder="Ex: economia, educação, saúde..."
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={addKeyword}
          disabled={loading || !newKeyword.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? '⏳' : '➕ Adicionar'}
        </button>
      </div>

      {/* Error message */}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-4">{error}</div>}

      {/* Keywords list */}
      <div className="space-y-2">
        {keywords.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum tema adicionado ainda</p>
        ) : (
          keywords.map((keyword) => (
            <div
              key={keyword}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">{keyword}</span>
              <button
                onClick={() => removeKeyword(keyword)}
                disabled={loading}
                className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
              >
                ✕ Remover
              </button>
            </div>
          ))
        )}
      </div>

      {/* Counter */}
      <div className="mt-4 text-xs text-gray-600">
        {keywords.length} / 100 keywords
      </div>
    </div>
  );
}
