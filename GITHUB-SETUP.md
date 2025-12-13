# 📦 Configuração para GitHub - TraderNex

Este guia explica como preparar o projeto para ser commitado no GitHub de forma segura.

## ✅ Checklist Antes de Fazer Push

### 1. Verificar Arquivos Sensíveis

```bash
# Verificar se há arquivos .env
git status | grep .env

# Se encontrar, remova do tracking (mas mantenha localmente)
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env
```

### 2. Verificar .gitignore

Certifique-se de que o `.gitignore` inclui:
- ✅ `.env` e todas as variações
- ✅ `node_modules/`
- ✅ Arquivos de log
- ✅ Credenciais e chaves

### 3. Verificar docker-compose.yml

O `docker-compose.yml` agora usa **apenas variáveis de ambiente**:
- ✅ Nenhuma senha hardcoded
- ✅ Nenhuma credencial exposta
- ✅ Todas as configurações via `${VARIAVEL}`

## 🔐 O que está Protegido

### ✅ Seguro para Commit
- `docker-compose.yml` (usa variáveis de ambiente)
- `ENV-TEMPLATE.md` (template sem dados reais)
- Código fonte
- Documentação

### ❌ NUNCA Commite
- Arquivos `.env` (está no .gitignore)
- Credenciais de email
- Senhas de banco de dados
- Chaves JWT
- Tokens de API

## 📝 Como Outros Desenvolvedores Vão Configurar

1. Clone o repositório
2. Copie `ENV-TEMPLATE.md` para `.env`
3. Preencha com suas próprias credenciais
4. Execute `docker-compose up --build`

## 🚀 Comandos para Primeiro Commit

```bash
# Verificar o que será commitado
git status

# Adicionar arquivos
git add .

# Verificar novamente (não deve ter .env)
git status

# Commit
git commit -m "feat: configuração inicial do projeto"

# Criar branch dev
git checkout -b dev

# Push
git push origin dev
```

## ⚠️ Se Você Já Commiteu Dados Sensíveis

Se acidentalmente commitou um arquivo `.env`:

```bash
# Remover do histórico (CUIDADO: isso reescreve o histórico!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (apenas se for sua branch pessoal!)
git push origin --force --all
```

**Melhor solução**: Gere novas credenciais e atualize o `.env` local.

## 📚 Documentação para o Time

Todos os desenvolvedores devem:
1. Ler o [README.md](README.md)
2. Seguir o [SETUP-QUICK.md](SETUP-QUICK.md)
3. Usar o [ENV-TEMPLATE.md](ENV-TEMPLATE.md) como referência

---

✅ **Projeto pronto para GitHub!** 🎉
