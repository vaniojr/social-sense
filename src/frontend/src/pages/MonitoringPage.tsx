import { useEffect, useState, useCallback } from 'react';
import { useEntity } from '../context/EntityContext';
import { NewsListItem } from '../components/NewsListItem';
import { NewsFilters } from '../components/NewsFilters';
import { SentimentTimeline } from '../components/SentimentTimeline';

interface Article {
  id: number;
  title: string;
  description: string;
  source: string;
  url: string;
  published_at: string;
  sentiment_score?: number;
  themes?: string;
  state_code?: string;
}

export function MonitoringPage() {
  const { selectedId } = useEntity();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    sentiment: 'all',
    source: 'all',
    region: 'all',
    days: '7',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const loadArticles = useCallback(async () => {
    if (!selectedId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        entityId: selectedId,
        limit: '50',
        days: filters.days,
        ...(filters.sentiment !== 'all' && { sentiment: filters.sentiment }),
        ...(filters.source !== 'all' && { source: filters.source }),
        ...(filters.region !== 'all' && { region: filters.region }),
      });

      const response = await fetch(`${apiUrl}/api/news/filtered?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar notícias');
      }

      const data = await response.json();
      setArticles(data.articles || []);

      // Extract unique sources and regions
      const uniqueSources = Array.from(
        new Set(data.articles?.map((a: Article) => a.source).filter(Boolean) || [])
      ) as string[];
      const uniqueRegions = Array.from(
        new Set(data.articles?.map((a: Article) => a.state_code).filter(Boolean) || [])
      ) as string[];

      setSources(uniqueSources.sort());
      setRegions(uniqueRegions.sort());

      console.log(`📰 Loaded ${data.articles.length} articles`);
    } catch (err) {
      console.error('❌ Error loading articles:', err);
      setError('Erro ao carregar notícias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedId, filters.days, filters.sentiment, filters.source, filters.region, apiUrl]);

  useEffect(() => {
    loadArticles();
  }, [selectedId, filters.days, filters.sentiment, filters.source, filters.region, apiUrl]);

  if (!selectedId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Selecione uma entidade para visualizar notícias</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📰 Monitoramento de Notícias</h1>
        <p className="text-gray-600">
          {articles.length} artigos encontrados • Últimos {filters.days} dias
        </p>
      </div>

      {/* Filters */}
      <NewsFilters
        onFilter={(newFilters) => setFilters(newFilters)}
        sources={sources}
        regions={regions}
      />

      {/* Timeline */}
      <SentimentTimeline articles={articles} />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
            <p className="text-gray-600">Carregando notícias...</p>
          </div>
        </div>
      )}

      {/* News List */}
      {!loading && articles.length === 0 && !error && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nenhuma notícia encontrada com esses filtros</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Feed de Notícias</h2>
          <div className="space-y-0">
            {articles.map((article) => (
              <NewsListItem key={article.id} {...article} />
            ))}
          </div>

          {/* Load More Button */}
          <button
            onClick={loadArticles}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Carregar mais notícias
          </button>
        </div>
      )}
    </div>
  );
}
