import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Article {
  published_at: string;
  sentiment_score?: number;
}

interface SentimentTimelineProps {
  articles: Article[];
}

export function SentimentTimeline({ articles }: SentimentTimelineProps) {
  const chartData = useMemo(() => {
    if (!articles || articles.length === 0) {
      return [];
    }

    // Group articles by day
    const byDay: {
      [key: string]: { positive: number; negative: number; neutral: number; count: number };
    } = {};

    articles.forEach((article) => {
      const date = new Date(article.published_at);
      const dayKey = date.toISOString().split('T')[0];

      if (!byDay[dayKey]) {
        byDay[dayKey] = { positive: 0, negative: 0, neutral: 0, count: 0 };
      }

      const score = article.sentiment_score || 0;
      if (score > 0.2) {
        byDay[dayKey].positive++;
      } else if (score < -0.2) {
        byDay[dayKey].negative++;
      } else {
        byDay[dayKey].neutral++;
      }
      byDay[dayKey].count++;
    });

    // Convert to array and calculate average sentiment
    return Object.entries(byDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => {
        const avgSentiment = articles
          .filter((a) => a.published_at.split('T')[0] === date)
          .reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / data.count;

        return {
          date: new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
          fullDate: date,
          sentiment: parseFloat((avgSentiment * 100).toFixed(1)),
          positive: data.positive,
          negative: data.negative,
          neutral: data.neutral,
        };
      });
  }, [articles]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-[300px] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-4">Tendência de Sentimento (Últimos 7 dias)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Sentimento (%)', angle: -90, position: 'insideLeft' }}
            domain={[-100, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            formatter={(value: number) => {
              const sign = value >= 0 ? '+' : '';
              return `${sign}${value.toFixed(1)}%`;
            }}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorSentiment)"
            name="Sentimento Médio"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs text-gray-600">Positivos</p>
          <p className="text-lg font-bold text-green-600">
            {chartData.reduce((sum, d) => sum + d.positive, 0)}
          </p>
        </div>
        <div className="bg-yellow-50 rounded p-2">
          <p className="text-xs text-gray-600">Neutros</p>
          <p className="text-lg font-bold text-yellow-600">
            {chartData.reduce((sum, d) => sum + d.neutral, 0)}
          </p>
        </div>
        <div className="bg-red-50 rounded p-2">
          <p className="text-xs text-gray-600">Negativos</p>
          <p className="text-lg font-bold text-red-600">
            {chartData.reduce((sum, d) => sum + d.negative, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
