# 🛡️ Guia do Painel Administrativo

## 📍 Como Acessar o Painel de Admin

### Opção 1: Via Sidebar (Recomendado)
1. **Faça login com um usuário admin** (email: `admin@tradernex.com` ou outro usuário com `is_admin = TRUE`)
2. No **Sidebar** (menu lateral esquerdo), você verá uma nova seção chamada **"Administração"**
3. Clique em **"Painel Admin"** (ícone de escudo 🛡️)

### Opção 2: Via URL Direta
Acesse diretamente: `http://localhost:5173/admin` (ou a URL do seu frontend)

⚠️ **Importante**: Se você não for admin, será redirecionado automaticamente para o dashboard.

---

## 🔐 Pré-requisitos

### 1. Executar as Migrações
Primeiro, você precisa executar as migrações do banco de dados:

```powershell
# Windows PowerShell
.\run-migrations.ps1

# Ou manualmente via Docker
docker-compose exec db psql -U postgres -d tradernex
```

Depois execute:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
```

### 2. Verificar se o Usuário é Admin
```sql
SELECT email, first_name, last_name, is_admin 
FROM users 
WHERE email = 'admin@tradernex.com';
```

O resultado deve mostrar `is_admin = TRUE` ou `t`.

### 3. Fazer Login Novamente
Após atualizar o banco, faça **logout e login novamente** para que o sistema reconheça você como admin.

---

## 📋 O Que Tem no Painel de Admin

### 🎯 Seção: **Contas MT4**

Uma tabela completa com **todas as contas MT4 de todos os usuários** do sistema.

#### Colunas da Tabela:

1. **Usuário**
   - Nome completo do usuário
   - Email do usuário (em texto menor abaixo do nome)

2. **Login MT4**
   - Número da conta MT4 cadastrada pelo usuário

3. **Corretora**
   - Nome da corretora (ex: IC Markets, XM, etc.)

4. **Servidor**
   - Nome do servidor MT4 (ex: ICMarkets-Live18)

5. **Saldo**
   - Saldo atual da conta MT4 em USD

6. **Login MyFXBook** ⭐
   - Campo **editável** onde você pode configurar o login de integração MyFXBook
   - Se não configurado, mostra "Não configurado" em itálico

7. **Ações**
   - Botão **"Editar"** para editar o login de integração MyFXBook

---

## ✏️ Como Editar o Login MyFXBook

### Passo a Passo:

1. **Encontre a conta MT4** do usuário na tabela
2. Clique no botão **"Editar"** na coluna "Ações"
3. O campo "Login MyFXBook" se transforma em um **campo de texto editável**
4. Digite o **login de integração MyFXBook** do usuário
5. Clique em **"Salvar"** para confirmar
   - Ou clique em **"Cancelar"** para descartar as alterações

### Exemplo:
```
Usuário: João Silva
Login MT4: 82139402
Login MyFXBook: [Editar] → Digite: "joao_silva_myfxbook" → [Salvar]
```

---

## 🎨 Interface Visual

### Layout:
- **Cabeçalho**: "Painel Administrativo" com subtítulo
- **Aba**: "Contas MT4" (pode ser expandido no futuro)
- **Tabela**: Design moderno com hover effects
- **Cores**: 
  - Botões de ação: Verde (#00afaa)
  - Texto: Cinza escuro (#111827)
  - Fundo: Branco com bordas suaves

### Estados:
- **Carregando**: Mostra "Carregando contas MT4..."
- **Vazio**: Mostra "Nenhuma conta MT4 encontrada."
- **Com dados**: Tabela completa com todas as informações

---

## 🔒 Segurança

### Proteções Implementadas:

1. **Middleware de Autenticação**
   - Verifica se o usuário está logado
   - Verifica se o usuário é admin (`is_admin = TRUE`)

2. **Redirecionamento Automático**
   - Se não for admin, redireciona para `/dashboard`
   - Retorna erro 403 (Forbidden) na API

3. **Validação no Backend**
   - Todas as rotas de admin verificam permissões
   - Apenas admins podem ver/editar dados

---

## 🚀 Funcionalidades Futuras (Pode ser expandido)

A estrutura está preparada para adicionar mais funcionalidades:

- ✅ **Contas MT4** (implementado)
- 🔜 **Conexões MyFXBook** (estrutura pronta)
- 🔜 **Gerenciamento de Usuários**
- 🔜 **Estatísticas Gerais**
- 🔜 **Logs do Sistema**
- 🔜 **Configurações Globais**

---

## 🐛 Troubleshooting

### Problema: Não vejo o link "Painel Admin" no Sidebar

**Soluções:**
1. Verifique se executou as migrações
2. Verifique se o usuário tem `is_admin = TRUE` no banco
3. Faça **logout e login novamente**
4. Limpe o cache do navegador

### Problema: Erro 403 ao acessar /admin

**Soluções:**
1. Verifique se o usuário é admin no banco:
   ```sql
   SELECT email, is_admin FROM users WHERE email = 'seu-email@exemplo.com';
   ```
2. Se `is_admin = FALSE`, atualize:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'seu-email@exemplo.com';
   ```
3. Faça logout e login novamente

### Problema: Tabela vazia

**Soluções:**
1. Verifique se há contas MT4 cadastradas:
   ```sql
   SELECT COUNT(*) FROM mt4_accounts;
   ```
2. Verifique se o backend está rodando
3. Verifique os logs do backend para erros

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do backend: `docker-compose logs backend`
2. Verifique o console do navegador (F12)
3. Verifique se todas as migrações foram executadas

---

## ✅ Checklist de Configuração

- [ ] Migrações executadas (`is_admin` e `myfxbook_integration_login`)
- [ ] Usuário admin configurado (`is_admin = TRUE`)
- [ ] Logout e login novamente
- [ ] Link "Painel Admin" aparece no Sidebar
- [ ] Consegue acessar `/admin`
- [ ] Vê a tabela de contas MT4
- [ ] Consegue editar login MyFXBook

---

**Pronto! Agora você pode gerenciar todas as contas MT4 e configurar os logins de integração MyFXBook! 🎉**

