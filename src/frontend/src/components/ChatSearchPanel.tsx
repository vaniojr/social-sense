import { useState } from 'react';

interface SearchResult {
  conversationId: string;
  title: string;
  matchContext: string;
  createdAt: string;
}

interface ChatSearchPanelProps {
  entityId: string;
  apiUrl: string;
  onSelectConversation: (conversationId: string) => void;
  onClose: () => void;
}

export function ChatSearchPanel({
  entityId,
  apiUrl,
  onSelectConversation,
  onClose,
}: ChatSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/chat/search?entityId=${entityId}&q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('❌ Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">🔍 Buscar Conversas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por palavra-chave..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? '⏳' : '🔍'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {results.length === 0 && query ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum resultado encontrado
            </p>
          ) : (
            results.map(result => (
              <button
                key={result.conversationId}
                onClick={() => {
                  onSelectConversation(result.conversationId);
                  onClose();
                }}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-gray-900 text-sm mb-1">
                  {result.title}
                </div>
                <div className="text-xs text-gray-600 line-clamp-2 mb-1">
                  {result.matchContext}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(result.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-gray-200 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
