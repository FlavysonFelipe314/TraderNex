# 🔄 Persistência Real do Myfxbook - Reconexão Automática

📖 **Documentação relacionada:**
- [Como Conectar Myfxbook](COMO-CONECTAR-MYFXBOOK.md) - Passo a passo
- [README Principal](../README.md) - Documentação completa

## ✅ O que foi implementado:

### 1. **Armazenamento Seguro de Credenciais**
- Senha do Myfxbook é **criptografada** usando AES-256-CBC antes de salvar no banco
- Criptografia usa chave secreta (definida no `.env` ou gerada automaticamente)
- Senha nunca é armazenada em texto plano

### 2. **Reconexão Automática**
Quando o usuário faz login novamente:
- Sistema verifica se há conexão Myfxbook salva
- Se a sessão estiver válida → carrega dados automaticamente
- Se a sessão expirou → **reconecta automaticamente** usando a senha criptografada
- Busca contas e dados automaticamente

### 3. **Comportamento ao Desconectar**
- **Desconectar Sessão** (padrão): Remove apenas a sessão, mantém credenciais
  - Reconexão automática no próximo login
  - Ideal para manter a conexão persistente
  
- **Desconectar Completamente**: Remove tudo (sessão + credenciais)
  - Requer reconexão manual
  - Use apenas se quiser remover completamente

## 🔧 Como Funciona:

1. **Primeira Conexão:**
   ```
   Usuário conecta → Senha criptografada → Salva no banco → Sessão ativa
   ```

2. **Logout/Login:**
   ```
   Usuário faz login → Sistema verifica sessão
   ├─ Sessão válida → Carrega dados ✅
   └─ Sessão expirada → Reconecta automaticamente com senha salva ✅
   ```

3. **Reconexão Automática:**
   ```
   Sessão expirada detectada
   → Descriptografa senha
   → Faz novo login no Myfxbook
   → Atualiza sessão no banco
   → Busca contas e dados
   → Exibe tudo automaticamente
   ```

## 🔐 Segurança:

- Senha criptografada com AES-256-CBC
- Chave de criptografia definida no `.env` (ENCRYPTION_KEY)
- IV (Initialization Vector) único para cada criptografia
- Senha nunca aparece em logs ou respostas

## 📝 Variável de Ambiente:

Adicione ao `.env` (opcional, mas recomendado):
```env
ENCRYPTION_KEY=suachavesecretahexadecimale64caracteres
```

Se não adicionar, uma chave será gerada automaticamente, mas mudará a cada reinício do servidor.

Para gerar uma chave:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Migração Executada:

A coluna `encrypted_password` foi adicionada à tabela `myfxbook_connections`.

## 🎯 Resultado:

Agora os dados do Myfxbook **persistem realmente**:
- ✅ Conecta uma vez
- ✅ Faz logout
- ✅ Faz login novamente
- ✅ **Dados aparecem automaticamente sem precisar reconectar!**

