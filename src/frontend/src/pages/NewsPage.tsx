import { useEffect, useState } from 'react';
import { useEntity } from '../context/EntityContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  published_at?: string;
  sentiment_score?: number;
  themes?: string[];
  region?: string;
}

function sentimentToColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#e5e7eb';
  if (score <= -1) return '#dc2626';
  if (score < -0.5) return '#ef4444';
  if (score < 0) return '#f87171';
  if (score <= 0.2) return '#fbbf24';
  if (score <= 0.5) return '#84cc16';
  return '#22c55e';
}

function getSentimentLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return '-';
  if (score <= -1) return 'Muito negativo';
  if (score < -0.5) return 'Negativo';
  if (score < 0) return 'Levemente negativo';
  if (score <= 0.2) return 'Neutro';
  if (score <= 0.5) return 'Positivo';
  return 'Muito positivo';
}

export function NewsPage() {
  const { selectedId, selected } = useEntity();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Load news articles
  useEffect(() => {
    if (!selectedId) return;

    const loadNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/api/news?entityId=${selectedId}`);
        if (!response.ok) throw new Error('Failed to load news');
        const data = await response.json();
        setArticles(data.articles || []);
        console.log(`✅ Loaded ${data.articles?.length || 0} articles`);
      } catch (err) {
        console.error('Error loading news:', err);
        setError('Erro ao carregar notícias');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [selectedId, apiUrl]);

  // Fetch news from NewsAPI
  const handleFetchNews = async () => {
    if (!selectedId) return;

    setFetching(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/news/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: selectedId }),
      });

      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      console.log(`✅ Fetched: ${data.fetched}, New: ${data.new}, Analyzed: ${data.analyzed}`);

      // Reload news list
      const newsResponse = await fetch(`${apiUrl}/api/news?entityId=${selectedId}`);
      const newsData = await newsResponse.json();
      setArticles(newsData.articles || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Erro ao buscar notícias. Verifique sua conexão ou tente novamente.');
    } finally {
      setFetching(false);
    }
  };

  // Calculate statistics
  const avgSentiment = articles.length > 0
    ? (articles.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / articles.length).toFixed(2)
    : '0.00';

  const allThemes = new Map<string, number>();
  articles.forEach(article => {
    (article.themes || []).forEach(theme => {
      allThemes.set(theme, (allThemes.get(theme) || 0) + 1);
    });
  });
  const topThemes = Array.from(allThemes.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);

  // Data for chart
  const chartData = [
    { name: 'Muito Neg.', count: articles.filter(a => (a.sentiment_score || 0) <= -1).length },
    { name: 'Negativo', count: articles.filter(a => (a.sentiment_score || 0) < -0.5 && (a.sentiment_score || 0) > -1).length },
    { name: 'Neutro', count: articles.filter(a => (a.sentiment_score || 0) >= -0.5 && (a.sentiment_score || 0) <= 0.5).length },
    { name: 'Positivo', count: articles.filter(a => (a.sentiment_score || 0) > 0.5).length },
  ];

  if (!selectedId) {
    return (
      <div className="min-h-screen bg-slate-50 pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-gray-500">Selecione uma entidade para ver notícias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📰 Monitoramento de Notícias</h1>
          <p className="text-gray-600">
            {selected?.name} • {selected?.type}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Fetch Button */}
        <div className="mb-6">
          <button
            onClick={handleFetchNews}
            disabled={fetching || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
          >
            {fetching ? '⏳ Buscando...' : '🔄 Atualizar Notícias'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg">
            <div className="text-gray-500 text-center">
              <div className="animate-spin mb-2">⏳</div>
              Carregando notícias...
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* News Feed */}
            <div className="lg:col-span-2 space-y-4">
              {articles.map(article => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">{article.source}</span>
                        <span className="text-xs text-gray-400">
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {article.description || 'Sem descrição'}
                      </p>
                      {article.themes && article.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.themes.slice(0, 3).map(theme => (
                            <span
                              key={theme}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {article.sentiment_score !== null && article.sentiment_score !== undefined && (
                      <div className="flex-shrink-0 text-right">
                        <div
                          className="text-lg font-bold"
                          style={{ color: sentimentToColor(article.sentiment_score) }}
                        >
                          {article.sentiment_score.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getSentimentLabel(article.sentiment_score)}
                        </div>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>

            {/* Sidebar Statistics */}
            <div className="space-y-4">
              {/* Sentiment Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Sentimento Médio</h3>
                <div className="text-3xl font-bold" style={{ color: sentimentToColor(parseFloat(avgSentiment)) }}>
                  {avgSentiment}
                </div>
                <p className="text-xs text-gray-500 mt-2">{articles.length} artigos analisados</p>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribuição de Sentimentos</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Themes */}
              {topThemes.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Principais Temas</h3>
                  <div className="space-y-2">
                    {topThemes.map(theme => (
                      <div
                        key={theme}
                        className="px-3 py-2 bg-blue-50 text-blue-800 rounded text-xs font-medium"
                      >
                        {theme}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">Nenhuma notícia ainda</p>
            <button
              onClick={handleFetchNews}
              disabled={fetching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
            >
              {fetching ? '⏳ Buscando...' : '🔄 Buscar Notícias Agora'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
