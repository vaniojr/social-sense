import { useState } from 'react';

interface NewsListItemProps {
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

export function NewsListItem({
  title,
  description,
  source,
  url,
  published_at,
  sentiment_score,
  themes,
  state_code,
}: NewsListItemProps) {
  const [showFullText, setShowFullText] = useState(false);

  const getSentimentColor = (score?: number) => {
    if (score === undefined || score === null) return 'bg-gray-50 border-gray-200';
    if (score > 0.2) return 'bg-green-50 border-green-200';
    if (score < -0.2) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getSentimentBadge = (score?: number) => {
    if (score === undefined || score === null) return { text: 'N/A', color: 'bg-gray-200 text-gray-800' };
    if (score > 0.2) return { text: `Positivo ${(score * 100).toFixed(0)}%`, color: 'bg-green-200 text-green-800' };
    if (score < -0.2) return { text: `Negativo ${(Math.abs(score) * 100).toFixed(0)}%`, color: 'bg-red-200 text-red-800' };
    return { text: `Neutro`, color: 'bg-yellow-200 text-yellow-800' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'agora';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const badge = getSentimentBadge(sentiment_score);
  const truncatedDesc = description && description.length > 200 ? description.substring(0, 200) + '...' : description;

  return (
    <div className={`border rounded-lg p-4 mb-3 transition-all hover:shadow-md ${getSentimentColor(sentiment_score)}`}>
      {/* Header with title and source */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 flex-1 pr-2">{title}</h3>
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
          {source}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-700 mb-3 leading-relaxed">
        {showFullText ? description : truncatedDesc}
      </p>

      {/* Footer with metadata */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Time badge */}
          <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
            {formatDate(published_at)}
          </span>

          {/* Sentiment badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.color}`}>
            {badge.text}
          </span>

          {/* Region badge */}
          {state_code && (
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
              {state_code}
            </span>
          )}

          {/* Themes */}
          {themes && (
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded truncate">
              {themes}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {description && description.length > 200 && (
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              {showFullText ? 'Menos' : 'Mais'}
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Ler →
          </a>
        </div>
      </div>
    </div>
  );
}
