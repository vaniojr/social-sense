# Email Setup - Zoho Mail + Gmail

## 🎯 O Que Você Terá ao Final

```
✅ Email profissional: hello@socialsense.io
✅ Zoho Mail (gratuito)
✅ Acesso via Gmail
✅ App desktop (Zoho)
✅ App mobile (Zoho)
```

---

## Passo 1: Registrar Domínio (socialsense.io)

### Em Cloudflare Registrar

```
1. Vá em: https://www.cloudflare.com/products/registrar/
2. Clique "Register Domain"
3. Busque: socialsense
4. Selecione: socialsense.io
5. Clique "Add to cart"
6. Faça checkout (R$ 60-90)
7. Confirme email
8. Pronto! Domínio registrado
```

**Salve:**
- [ ] Domínio: socialsense.io
- [ ] Nameservers (vão ser do Cloudflare)
- [ ] Email de confirmação

---

## Passo 2: Criar Email em Zoho Mail

### Criar Conta Zoho

```
1. Vá em: https://zoho.com/mail/
2. Clique "Sign Up Free"
3. Preencha:
   - Nome completo
   - Email (use pessoal, ex: seu@gmail.com)
   - Senha (forte)
4. Clique "Continue"
5. Zoho envia link de confirmação
6. Confirme email
```

### Criar Email Profissional

```
1. Faça login em Zoho Mail
2. Vá em: Configurações → Contas
3. Clique "Add Domain"
4. Preencha: socialsense.io
5. Zoho confirma propriedade do domínio:
   - Option 1: Adicione registro MX (recomendado)
   - Option 2: Adicione arquivo HTML (menos comum)
6. Espere confirmação (pode levar 1 hora)
7. Crie email: hello@socialsense.io
```

**Zoho vai dar:**
```
- 5 contas de email grátis
- 25 GB de storage
- IMAP/POP3 acesso
- Webmail interface
```

---

## Passo 3: Configurar DNS em Cloudflare

### Adicionar Registros MX

```
Zoho vai dar registros tipo:

MX Record 1:
Priority: 10
Host: @
Value: mx.zoho.com

MX Record 2:
Priority: 20
Host: @
Value: mx2.zoho.com

MX Record 3:
Priority: 50
Host: @
Value: mx3.zoho.com

SPKF Record:
Host: @
Value: v=spf1 include:zoho.com ~all

DKIM Record:
Host: zoho._domainkey
Value: v=DKIM1; k=rsa; p=[chave grande do DKIM]
```

### Como Adicionar em Cloudflare

```
1. Vá em: https://dash.cloudflare.com/
2. Selecione: socialsense.io
3. Vá em: DNS
4. Clique "+ Add Record"
5. Tipo: MX
6. Priority: 10
7. Value: mx.zoho.com
8. Clique "Save"
9. Repita para outros MX records
10. Adicione SPF e DKIM também
```

**Aguarde propagação:** ~1 hora (sometimes 24h)

---

## Passo 4: Adicionar Zoho no Gmail (IMAP)

### Receber Emails de Zoho em Gmail

```
1. Abra Gmail: https://mail.google.com
2. Vá em: Configurações → Contas e importação
3. Clique: "Adicionar outra conta de email"
4. Preencha: hello@socialsense.io
5. Clique "Próximo"
6. Selecione: "IMAP"
7. Preencha servidor IMAP:
   - IMAP Server: imap.zoho.com
   - Porta: 993
   - Username: hello@socialsense.io
   - Password: [sua senha Zoho]
   - Encryption: SSL/TLS (padrão)
8. Clique "Adicionar conta"
9. Gmail sincroniza emails de Zoho
```

---

## Passo 5: Configurar Envio (SMTP) no Gmail

### Responder Como hello@socialsense.io

```
1. Gmail → Configurações → Contas e importação
2. Role para: "Enviar emails como"
3. Clique: "+ Adicionar outro endereço de email"
4. Preencha:
   - Nome: Social Sense (ou seu nome)
   - Email: hello@socialsense.io
5. Clique "Próximo"
6. Configurar servidor SMTP:
   - SMTP Server: smtp.zoho.com
   - Port: 465
   - Username: hello@socialsense.io
   - Password: [sua senha Zoho]
   - Encryption: SSL
7. Clique "Adicionar conta"
8. Gmail envia email de confirmação para hello@socialsense.io
9. Confirme em Zoho Mail
10. Volte para Gmail, confirme no prompt
```

**Resultado:**
```
Quando você escreve email no Gmail:
- Pode escolher enviar como seu@gmail.com
- OU como hello@socialsense.io
- Destinatário vê: hello@socialsense.io
- Email vai de servidores Zoho
```

---

## Passo 6: Download Apps (Opcional)

### App Desktop (Zoho Mail)

```
1. Vá em: https://zoho.com/mail/apps/
2. Baixe app para:
   - Windows (Zoho Mail Desktop)
   - Mac (Zoho Mail Desktop)
3. Instale
4. Faça login com hello@socialsense.io
5. Desktop app sincroniza com Zoho
```

### App Mobile (iOS/Android)

```
1. iPhone: App Store → "Zoho Mail"
2. Android: Google Play → "Zoho Mail"
3. Instale app oficial Zoho
4. Faça login: hello@socialsense.io
5. Notificações push de novos emails
```

---

## ✅ Verificação Final

```
[ ] Domínio registrado: socialsense.io
[ ] Zoho Mail criado: hello@socialsense.io
[ ] DNS MX records adicionados em Cloudflare
[ ] Email recebe em Gmail (IMAP funcionando)
[ ] Email envia como hello@socialsense.io (SMTP funcionando)
[ ] App Desktop instalado (opcional)
[ ] App Mobile instalado (opcional)
```

### Teste Enviando Email

```
1. Abra Gmail
2. Clique "Compor"
3. Escolha enviar como: hello@socialsense.io
4. Envie para seu@gmail.com pessoal
5. Verifique que chegou
6. Responda
7. Veja resposta no Zoho Mail também
```

---

## 🚨 Troubleshooting

### Email não sincroniza em Gmail

```
Problema: Zoho em Gmail não recebe emails

Solução:
1. Verifique DNS MX records propagaram (wait 1 hour)
2. Teste IMAP direto:
   - Abra Thunderbird ou Outlook
   - Adicione conta com IMAP
   - Se funcionar aqui, problem é Gmail
3. Remove conta Gmail e re-adicione:
   - Gmail → Configurações → Contas
   - Remove conta Zoho
   - Re-adicione com IMAP
4. Verifique autenticação 2FA:
   - Zoho Mail → Segurança
   - Se 2FA ativo, use "App Password" em vez de senha
```

### Não consegue enviar (SMTP)

```
Problema: Erro ao enviar como hello@socialsense.io

Solução:
1. Verifique credenciais SMTP:
   - Server: smtp.zoho.com
   - Port: 465 (NOT 587)
   - Username: hello@socialsense.io
   - Password: [correta?]
2. Desabilite Autenticação 2FA temporariamente
3. Use "App Password":
   - Zoho → Segurança → Gerar App Password
   - Use essa password em Gmail SMTP
4. Teste com Thunderbird:
   - Se funciona em Thunderbird, problem é Gmail
   - Remove SMTP Gmail, re-configure
```

### Emails ficam em "Enviando..."

```
Problema: Gmail fica tentando enviar, não envia

Solução:
1. Limpe cache Gmail (Settings → Clear cache)
2. Teste em navegador incógnito
3. Remove conta SMTP Gmail
4. Re-adicione com dados CORRETOS
5. Se persiste, aguarde 24h (servidor pode estar blocado)
```

---

## 📝 Documento de Referência

Salve estas informações num lugar seguro:

```
ZOHO MAIL CONFIGURATION
━━━━━━━━━━━━━━━━━━━━
Email: hello@socialsense.io
Senha: [sua senha segura]
Telefone Recuperação: [seu tel]
Email Recuperação: [seu@gmail.com]

IMAP (Receber)
Servidor: imap.zoho.com
Porta: 993
Usuário: hello@socialsense.io
SSL: Ativado

SMTP (Enviar)
Servidor: smtp.zoho.com
Porta: 465
Usuário: hello@socialsense.io
SSL: Ativado

CLOUDFLARE DNS
Domínio: socialsense.io
MX1: 10 mx.zoho.com
MX2: 20 mx2.zoho.com
MX3: 50 mx3.zoho.com
SPF: v=spf1 include:zoho.com ~all
```

---

## 🎯 Próximo Passo

Uma vez email configurado:

1. Teste enviando/recebendo emails
2. Configure assinatura profissional em Zoho
3. Comece desenvolvimento do projeto
4. Use hello@socialsense.io para comunicação oficial

**Precisa de ajuda?** Ver [docs/SETUP_LOCAL.md](SETUP_LOCAL.md)
