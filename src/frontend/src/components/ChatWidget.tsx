import { useState, useRef, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Qual estado tem melhor sentimento?',
  'Quais temas estão em alta no Nordeste?',
  'Existe algum risco de crise atualmente?',
];

export function ChatWidget() {
  const { selectedId, selected } = useEntity();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    if (!selectedId) {
      setError('Selecione uma entidade primeiro');
      return;
    }

    const messageToSend = text || input;
    if (!messageToSend.trim()) return;

    setError(null);
    setInput('');

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: selectedId,
          message: messageToSend,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao conectar com o AI');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversationId);

      console.log('✅ Chat response received', {
        messageLength: data.response.length,
        conversationId: data.conversationId,
      });
    } catch (err) {
      console.error('❌ Chat error:', err);
      setError('Erro ao processar mensagem. Tente novamente.');
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  if (!selectedId) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl"
        aria-label="Chat"
        title={isOpen ? 'Fechar chat' : 'Abrir chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex flex-col">
              <span className="font-semibold text-sm">💬 Chat IA</span>
              <span className="text-xs opacity-90">{selected?.name}</span>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <button
                  onClick={startNewConversation}
                  className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-400 rounded transition-colors"
                  title="Iniciar nova conversa"
                >
                  🔄
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-400 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && !isLoading && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 mb-3">Pergunte algo sobre {selected?.name}:</p>
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 transition-colors text-gray-800"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm">
                  <span className="animate-pulse">Pensando...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-2">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !isLoading && sendMessage()}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
