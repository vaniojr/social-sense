// Chat Analysis Utilities

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  regionOfInterest?: string;
  dateRange?: { start: string; end: string };
  themes?: string[];
}

// Generate conversation title from first message
export function generateTitle(firstMessage: string, maxLength: number = 60): string {
  const cleaned = firstMessage.replace(/\n/g, ' ').trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength - 3) + '...';
}

// Extract keywords from user message
export function extractKeywords(message: string): {
  regions: string[];
  themes: string[];
  dateRange?: string;
} {
  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  const lowerMessage = message.toLowerCase();

  const regions = brazilianStates.filter(state =>
    lowerMessage.includes(state.toLowerCase())
  );

  // Extract themes (simple keyword matching)
  const commonThemes = ['economia', 'saúde', 'educação', 'segurança', 'política', 'infraestrutura', 'meio ambiente'];
  const themes = commonThemes.filter(theme => lowerMessage.includes(theme));

  // Detect date range references
  let dateRange: string | undefined;
  if (lowerMessage.includes('última') || lowerMessage.includes('último')) {
    if (lowerMessage.includes('semana')) dateRange = '7d';
    else if (lowerMessage.includes('mês')) dateRange = '30d';
    else if (lowerMessage.includes('ano')) dateRange = '365d';
  }

  return { regions, themes, dateRange };
}

// Build system prompt with context
export function buildSystemPrompt(
  entityName: string,
  entityType: string,
  context?: ConversationContext
): string {
  let prompt = `Você é um assistente de análise de sentimento para ${entityType} chamado "${entityName}". `;
  prompt += `Analise dados de notícias, redes sociais e menções públicas fornecidos pelo usuário. `;
  prompt += `Fornça insights acionáveis sobre sentimento, tendências e oportunidades de comunicação. `;

  if (context?.regionOfInterest) {
    prompt += `Foco em análise regional para: ${context.regionOfInterest}. `;
  }

  if (context?.themes && context.themes.length > 0) {
    prompt += `Temas de interesse: ${context.themes.join(', ')}. `;
  }

  prompt += `Sempre cite dados específicos quando disponíveis. Seja conciso mas informativo.`;

  return prompt;
}

// Format conversation history for context
export function formatConversationHistory(messages: ConversationMessage[]): string {
  return messages
    .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
    .join('\n\n');
}

// Extract sources from Claude response
export function extractSources(response: string): string[] {
  const sources: string[] = [];

  // Look for article IDs mentioned in the response
  const articleIdPattern = /article[_-]?id:?\s*([a-f0-9\-]+)/gi;
  let match;

  while ((match = articleIdPattern.exec(response)) !== null) {
    sources.push(match[1]);
  }

  return [...new Set(sources)]; // Remove duplicates
}

// Generate follow-up suggestions
export function generateFollowUpSuggestions(response: string): string[] {
  const suggestions: string[] = [];

  // Analyze response for natural follow-up questions
  const lowerResponse = response.toLowerCase();

  if (lowerResponse.includes('região') || lowerResponse.includes('estado')) {
    suggestions.push('Como esse sentimento varia por região?');
  }

  if (lowerResponse.includes('tendência') || lowerResponse.includes('crescente')) {
    suggestions.push('Qual é a tendência esperada nos próximos 30 dias?');
  }

  if (lowerResponse.includes('tema') || lowerResponse.includes('assunto')) {
    suggestions.push('Quais são os temas emergentes em alta?');
  }

  if (lowerResponse.includes('competidor')) {
    suggestions.push('Como isso se compara com meus competidores?');
  }

  // Return up to 3 suggestions
  return suggestions.slice(0, 3);
}
