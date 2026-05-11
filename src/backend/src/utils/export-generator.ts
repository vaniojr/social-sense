// Export Generator Utilities

export interface ConversationExportData {
  id: string;
  title: string;
  entityName: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

// Generate Markdown export
export function generateMarkdown(data: ConversationExportData): string {
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Entidade:** ${data.entityName}\n`;
  markdown += `**Data de Criação:** ${new Date(data.createdAt).toLocaleDateString('pt-BR')}\n`;
  markdown += `**Última Atualização:** ${new Date(data.updatedAt).toLocaleDateString('pt-BR')}\n\n`;
  markdown += `---\n\n`;

  data.messages.forEach(msg => {
    const role = msg.role === 'user' ? '**Você**' : '**Assistente**';
    markdown += `${role}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `---\n\n`;
  });

  return markdown;
}

// Generate JSON export
export function generateJSON(data: ConversationExportData): string {
  return JSON.stringify(data, null, 2);
}

// Generate PDF content (text format - to be rendered by pdfkit)
export function generatePDFContent(data: ConversationExportData): string {
  let content = '';

  content += `${'='.repeat(70)}\n`;
  content += `${data.title}\n`;
  content += `${'='.repeat(70)}\n\n`;

  content += `Entidade: ${data.entityName}\n`;
  content += `Data de Criação: ${new Date(data.createdAt).toLocaleDateString('pt-BR')}\n`;
  content += `Última Atualização: ${new Date(data.updatedAt).toLocaleDateString('pt-BR')}\n`;
  content += `ID: ${data.id}\n\n`;

  content += `${'='.repeat(70)}\n\n`;

  data.messages.forEach((msg, idx) => {
    const role = msg.role === 'user' ? 'VOCÊ' : 'ASSISTENTE';
    content += `[${idx + 1}] ${role} (${new Date(msg.timestamp).toLocaleTimeString('pt-BR')})\n`;
    content += `${'-'.repeat(70)}\n`;
    content += `${msg.content}\n\n`;
  });

  content += `${'='.repeat(70)}\n`;
  content += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;

  return content;
}

// Get file extension by format
export function getFileExtension(format: 'pdf' | 'markdown' | 'json'): string {
  const extensions: Record<string, string> = {
    pdf: '.pdf',
    markdown: '.md',
    json: '.json',
  };
  return extensions[format] || '.txt';
}

// Generate filename from conversation title
export function generateFilename(title: string, format: 'pdf' | 'markdown' | 'json'): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  const timestamp = new Date().getTime();
  const ext = getFileExtension(format);

  return `conversation-${sanitized}-${timestamp}${ext}`;
}

// Validate export format
export function isValidExportFormat(format: string): format is 'pdf' | 'markdown' | 'json' {
  return ['pdf', 'markdown', 'json'].includes(format);
}

// Calculate export file size estimate
export function estimateFileSize(format: string, contentLength: number): string {
  let sizeBytes = 0;

  switch (format) {
    case 'json':
      sizeBytes = contentLength * 1.1; // JSON with whitespace
      break;
    case 'markdown':
      sizeBytes = contentLength * 0.9; // Markdown slightly compressed
      break;
    case 'pdf':
      sizeBytes = contentLength * 0.5; // PDF typically 50% of text size
      break;
    default:
      sizeBytes = contentLength;
  }

  if (sizeBytes < 1024) return `${Math.round(sizeBytes)} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(2)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}
