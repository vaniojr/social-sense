import { useState, useEffect, useRef } from 'react';
import { useEntity } from '../context/EntityContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export function EnhancedChatWidget() {
  const { selectedId } = useEntity();
  const [isOpen, setIsOpen] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Load conversations on open
  useEffect(() => {
    if (isOpen && selectedId) {
      loadConversations();
    }
  }, [isOpen, selectedId]);

  // Load messages for current conversation
  useEffect(() => {
    if (currentConversationId) {
      loadConversation();
    }
  }, [currentConversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!selectedId) return;
    try {
      const response = await fetch(`${apiUrl}/api/chat/conversations?entity_id=${selectedId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('❌ Error loading conversations:', err);
    }
  };

  const loadConversation = async () => {
    if (!currentConversationId) return;
    try {
      const response = await fetch(`${apiUrl}/api/chat/conversations/${currentConversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('❌ Error loading conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedId) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: selectedId,
          message: userMessage,
          context: {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          ...messages,
          {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString(),
          },
        ]);

        if (!currentConversationId && data.conversationId) {
          setCurrentConversationId(data.conversationId);
          await loadConversations();
        }
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowConversationList(false);
  };

  const handleSelectConversation = (convId: string) => {
    setCurrentConversationId(convId);
    setShowConversationList(false);
  };

  if (!selectedId) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-xl z-40"
          title="Abrir chat"
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">
                {currentConversationId ? '💬 Chat' : '✨ Novo Chat'}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className="hover:bg-blue-700 p-2 rounded transition-colors"
                title="Histórico"
              >
                📋
              </button>
              <button
                onClick={handleNewConversation}
                className="hover:bg-blue-700 p-2 rounded transition-colors"
                title="Novo chat"
              >
                ➕
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-2 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Conversation list */}
          {showConversationList && (
            <div className="border-b border-gray-200 p-3 max-h-32 overflow-y-auto bg-gray-50">
              {conversations.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhuma conversa</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        currentConversationId === conv.id
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-semibold truncate">{conv.title}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(conv.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-gray-500 text-sm">
                <p>Comece uma conversa sobre sentimento e tendências</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Sua pergunta..."
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm"
            >
              {loading ? '⏳' : '→'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
