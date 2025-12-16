# 🤝 Guia de Contribuição - TraderNex

Obrigado por considerar contribuir com o TraderNex! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Depois clone seu fork
git clone https://github.com/seu-usuario/tradernex.git
cd tradernex
```

### 2. Crie uma Branch

```bash
git checkout -b feature/nome-da-sua-feature
# ou
git checkout -b fix/nome-do-bug
```

### 3. Configure o Ambiente

```bash
# Copie o template de variáveis de ambiente
cp ENV-TEMPLATE.md .env
# Edite o .env com suas configurações

# Inicie os containers
docker-compose up -d --build
```

### 4. Faça suas Alterações

- Siga os padrões de código existentes
- Adicione comentários quando necessário
- Teste suas alterações localmente

### 5. Commit

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
# ou
git commit -m "fix: corrige bug Y"
```

**Convenção de Commits:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas de manutenção

### 6. Push e Pull Request

```bash
git push origin feature/nome-da-sua-feature
```

Depois abra um Pull Request no GitHub.

## 📝 Padrões de Código

### Backend (Node.js)

- Use `camelCase` para variáveis e funções
- Use `PascalCase` para classes
- Adicione comentários JSDoc para funções públicas
- Mantenha funções pequenas e focadas

### Frontend (React)

- Use componentes funcionais com hooks
- Use `PascalCase` para componentes
- Mantenha componentes pequenos e reutilizáveis
- Use TypeScript quando possível (futuro)

## 🧪 Testando

Antes de fazer commit:

1. Teste localmente com Docker
2. Verifique se não há erros de lint
3. Teste as funcionalidades afetadas

## 📚 Documentação

- Atualize o README.md se necessário
- Adicione comentários em código complexo
- Documente novas APIs no Swagger

## ❓ Dúvidas?

Abra uma issue no GitHub para discutir mudanças maiores antes de implementar.

Obrigado por contribuir! 🎉
