# Issues Resolvidas - 2026-05-12

Este documento formaliza os problemas identificados e corrigidos no Social Sense em 2026-05-12.

## Issue #1: Chat Widget - /api/chat/conversations returns 400 Bad Request

**Tipo:** 🐛 Bug  
**Severidade:** Alto (funcionalidade quebrada)  
**Status:** ✅ RESOLVIDO

### Descrição
Endpoint GET `/api/chat/conversations` retorna erro 400 Bad Request ao tentar carregar histórico de conversas no War Room.

### Como Reproduzir
1. Abrir War Room (http://localhost:3000/war-room)
2. Abrir chat widget (botão 💬)
3. Verificar erro 400 no console do navegador

### Root Cause
Mismatch entre parâmetro enviado e esperado:
- Frontend enviava: `entity_id=...` (snake_case)
- Backend esperava: `entityId` (camelCase)

### Solução Implementada
Atualizar endpoint do backend para aceitar `entity_id` em vez de `entityId`.

**Arquivo afetado:** `src/backend/src/main.ts` (linha 1816)
```typescript
// Antes:
const { entityId } = req.query;
if (!entityId) {
  res.status(400).json({ error: 'entityId required' });
}

// Depois:
const { entity_id } = req.query;
if (!entity_id) {
  res.status(400).json({ error: 'entity_id required' });
}
```

**Commit:** 8b91cf3 (fix: Chat widget 400 error and markdown rendering)

---

## Issue #2: Chat - Markdown special characters not rendering correctly

**Tipo:** 🎨 UI/Enhancement  
**Severidade:** Médio (respostas difíceis de ler)  
**Status:** ✅ RESOLVIDO

### Descrição
Respostas do chat contêm caracteres especiais de markdown (##, **, etc.) que não são renderizados como markdown, aparecendo como texto plano.

### Como Reproduzir
1. Abrir War Room
2. Enviar mensagem no chat
3. Observar resposta do assistente com headers (##) e bold (**) como texto plano

### Exemplo
Resposta continha:
```
## Status Atual
**Sentimento geral**: Neutro
```

Mas era exibida como texto plano em vez de:
- "Status Atual" como heading
- "Sentimento geral" em negrito

### Solução Implementada
Adicionar ReactMarkdown para renderizar respostas do assistente com suporte completo a markdown.

**Arquivo afetado:** `src/frontend/src/components/EnhancedChatWidget.tsx`
- Import: `import ReactMarkdown from 'react-markdown'`
- Componentes customizados para:
  - Headers (h1, h2, h3)
  - Bold/Italic
  - Lists (ol, ul)
  - Code blocks com highlight

**Commit:** 8b91cf3 (fix: Chat widget 400 error and markdown rendering)

---

## Issue #3: War Room - Internal development labels visible to users

**Tipo:** ⚠️ Bug  
**Severidade:** Médio (confunde usuários)  
**Status:** ✅ RESOLVIDO

### Descrição
Rótulos internos de desenvolvimento (Fase, Bloco) estão visíveis na UI do War Room dashboard, violando separação entre código interno e interface do usuário.

### Locais Afetados
1. Título principal: `"🎯 War Room - Fase 3"` (contém rótulo "Fase 3")
2. Heading de recomendações: `"💡 Recomendações de Ação (Bloco L)"` (contém rótulo "Bloco L")

### Como Reproduzir
1. Ir para http://localhost:3000/war-room
2. Observar title contendo "Fase 3"
3. Observar heading contendo "(Bloco L)"

### Solução Implementada
Remover rótulos internos do texto visível ao usuário, mantendo-os apenas em comentários de código.

**Arquivo afetado:** `src/frontend/src/pages/WarRoomDashboard.tsx`

```typescript
// Linha 99 - Antes:
<h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 War Room - Fase 3</h1>

// Linha 99 - Depois:
<h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 War Room</h1>

// Linha 124 - Antes:
💡 Recomendações de Ação (Bloco L)

// Linha 124 - Depois:
💡 Recomendações de Ação
```

**Nota:** Rótulos internos em comentários de código foram mantidos:
- `{/* Performance Metrics (Bloco K) */}` ✓
- `{/* Action Recommendations (Bloco L) */}` ✓

**Commit:** 4f3559c (fix: Remove internal development labels from War Room dashboard)

---

## Issue #4: Chat Widget - React key warning on message list

**Tipo:** ⚠️ Warning (React)  
**Severidade:** Baixo (console warning)  
**Status:** ✅ RESOLVIDO

### Descrição
Console exibe warning sobre chaves duplicadas na lista de mensagens do chat widget.

### Erro no Console
```
Warning: Each child in a list should have a unique "key" prop.
Check the render method of `EnhancedChatWidget`.
```

### Root Cause
Mistura de fontes de dados para mensagens:
- Mensagens carregadas do BD: usam IDs do banco
- Mensagens novas: usam `Date.now()` e `Date.now() + 1`
- Ao re-renderizar, potencial colisão de chaves

### Solução Implementada
Alterar padrão de chave para `${msg.role}-${idx}` (combinação de role + índice).

**Arquivo afetado:** `src/frontend/src/components/EnhancedChatWidget.tsx` (linha 222)

```typescript
// Antes:
{messages.map(msg => (
  <div key={msg.id} ...>

// Depois:
{messages.map((msg, idx) => (
  <div key={`${msg.role}-${idx}`} ...>
```

**Commit:** 8b91cf3 (fix: Chat widget 400 error and markdown rendering)

---

## Issue #5: Chat Widget - Improve error handling for missing data

**Tipo:** 🔧 Enhancement  
**Severidade:** Baixo (código limpo)  
**Status:** ✅ RESOLVIDO

### Descrição
Chat widget registra erros no console quando não há dados disponíveis (404), o que não é realmente um erro - é apenas ausência de dados.

### Problema
Quando um usuário não tem conversas salvas:
```
❌ Error loading conversations: 404
```

Isso polui o console e confunde usuários.

### Solução Implementada
Adicionar verificação de status HTTP para distinguir entre "recurso não existe" (404) e "erro no servidor" (5xx).

**Arquivo afetado:** `src/frontend/src/components/EnhancedChatWidget.tsx`

```typescript
// Antes:
if (response.ok) {
  setConversations(data.conversations || []);
}
// ... catch erro sempre

// Depois:
if (response.ok) {
  setConversations(data.conversations || []);
} else if (response.status !== 404) {
  console.error('❌ Error loading conversations:', response.status);
}
```

Aplicado em três funções:
- `loadConversations()` (linha ~55)
- `loadConversation()` (linha ~67)
- `handleSendMessage()` (linha ~95)

**Commit:** 8b91cf3 (fix: Chat widget 400 error and markdown rendering)

---

## Resumo de Mudanças

| Issue | Arquivo | Commits | Status |
|-------|---------|---------|--------|
| #1 | src/backend/src/main.ts | 8b91cf3 | ✅ |
| #2 | src/frontend/src/components/EnhancedChatWidget.tsx | 8b91cf3 | ✅ |
| #3 | src/frontend/src/pages/WarRoomDashboard.tsx | 4f3559c | ✅ |
| #4 | src/frontend/src/components/EnhancedChatWidget.tsx | 8b91cf3 | ✅ |
| #5 | src/frontend/src/components/EnhancedChatWidget.tsx | 8b91cf3 | ✅ |

---

## Testes de Validação

Todos os endpoints foram testados e validados:

✅ GET `/api/chat/conversations?entity_id=...` → Returns 200 with conversations array  
✅ POST `/api/chat` → Returns markdown-formatted response  
✅ Chat widget → Abre sem erros 400  
✅ Markdown rendering → Headers, bold, lists renderizam corretamente  
✅ War Room title → Sem rótulos "Fase" ou "Bloco"  
✅ Console → Sem warnings de React keys  

---

## Recomendações Futuras

1. **Criar template de issue**: Padronizar criação de issues para facilitar rastreamento
2. **Usar labels no GitHub**: Sempre categorizar issues (bug, enhancement, documentation, etc.)
3. **Referenciar commits**: Sempre mencionar o commit que resolveu a issue
4. **Fechar issues automaticamente**: Usar "Closes #123" na mensagem de commit
5. **Code Review**: Revisar PRs antes de merge para pegar problemas antes de chegar à produção

---

**Documento criado em:** 2026-05-12  
**Preparado por:** Claude Code  
**Status:** Todos os problemas resolvidos e validados
