import { useState } from 'react';

interface ConversationExporterProps {
  conversationId: string | null;
  conversationTitle: string;
  apiUrl: string;
  onClose: () => void;
}

export function ConversationExporter({
  conversationId,
  conversationTitle,
  apiUrl,
  onClose,
}: ConversationExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'markdown' | 'json'>('markdown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/chat/conversations/${conversationId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: selectedFormat }),
      });

      if (!response.ok) throw new Error('Erro ao exportar');

      const data = await response.json();

      // Create download link
      const downloadUrl = `${apiUrl}${data.filename}`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Close modal after successful export
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error('❌ Error exporting conversation:', err);
      setError(err instanceof Error ? err.message : 'Erro ao exportar');
    } finally {
      setLoading(false);
    }
  };

  const formatDescriptions = {
    pdf: '📄 PDF - Documento formatado para impressão',
    markdown: '📝 Markdown - Texto formatado para edição',
    json: '⚙️ JSON - Dados estruturados para integração',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📥 Exportar Conversa</h2>

        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm font-semibold text-gray-900">{conversationTitle}</p>
          <p className="text-xs text-gray-600 mt-1">
            Selecione o formato para download
          </p>
        </div>

        {/* Format selection */}
        <div className="space-y-2 mb-4">
          {(Object.keys(formatDescriptions) as Array<'pdf' | 'markdown' | 'json'>).map(
            format => (
              <label key={format} className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                style={{
                  borderColor: selectedFormat === format ? '#3b82f6' : '#e5e7eb',
                  backgroundColor: selectedFormat === format ? '#eff6ff' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="format"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={() => setSelectedFormat(format)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-sm">
                  {formatDescriptions[format]}
                </span>
              </label>
            )
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
          >
            {loading ? '⏳ Exportando...' : '✓ Exportar'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Arquivo expira em 30 dias
        </p>
      </div>
    </div>
  );
}
