import { useState, useEffect } from 'react';

interface Snippet {
  id: string;
  snippetText: string;
  createdAt: string;
}

interface SnippetHighlighterProps {
  conversationId: string | null;
  apiUrl: string;
}

export function SnippetHighlighter({ conversationId, apiUrl }: SnippetHighlighterProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadSnippets();
    }
  }, [conversationId]);

  const loadSnippets = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`${apiUrl}/api/chat/conversations/${conversationId}/snippets`);
      if (response.ok) {
        const data = await response.json();
        setSnippets(data.snippets || []);
      }
    } catch (err) {
      console.error('❌ Error loading snippets:', err);
    }
  };

  const handleSaveSnippet = async () => {
    if (!conversationId || !selectedText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/chat/conversations/${conversationId}/snippets`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snippetText: selectedText,
            messageContext: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        await loadSnippets();
        setSelectedText('');
        setShowForm(false);
      }
    } catch (err) {
      console.error('❌ Error saving snippet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowForm(true);
    }
  };

  if (!conversationId) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">📌 Snippets Salvos</h3>
        <button
          onClick={handleHighlight}
          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
        >
          Marcar texto
        </button>
      </div>

      {/* Save form */}
      {showForm && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <textarea
            value={selectedText}
            onChange={e => setSelectedText(e.target.value)}
            className="w-full border border-yellow-300 rounded px-2 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveSnippet}
              disabled={loading}
              className="flex-1 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? '⏳' : '✓'} Salvar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400 transition-colors"
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Snippets list */}
      {snippets.length === 0 ? (
        <p className="text-xs text-gray-500">Nenhum snippet salvo</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {snippets.map(snippet => (
            <div
              key={snippet.id}
              className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700"
            >
              <p className="line-clamp-2">{snippet.snippetText}</p>
              <p className="text-gray-500 text-xs mt-1">
                {new Date(snippet.createdAt).toLocaleTimeString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
