# 🔧 Correção dos Problemas do Docker

## Problemas Identificados

1. **Erro: Cannot find module 'axios'** - O axios não está instalado no container Docker
2. **Erro YAML do Swagger** - Problema na formatação do comentário JSDoc

## ✅ Solução Rápida

### Opção 1: Reconstruir o Docker sem cache (Recomendado)

```bash
# Parar os containers
docker-compose down

# Reconstruir sem cache para garantir que axios seja instalado
docker-compose build --no-cache backend

# Iniciar novamente
docker-compose up
```

### Opção 2: Instalar axios dentro do container

```bash
# Com o container rodando, execute:
docker-compose exec backend npm install axios

# Depois reinicie o container
docker-compose restart backend
```

### Opção 3: Reconstruir tudo

```bash
# Parar e remover tudo (incluindo volumes - CUIDADO!)
docker-compose down -v

# Reconstruir tudo
docker-compose build --no-cache

# Iniciar
docker-compose up
```

## 🎯 Executar Migração após Docker estar funcionando

Depois que o Docker estiver funcionando corretamente:

```bash
# Executar migração dentro do container
docker-compose exec backend npm run migrate
```

## ✅ Verificar se funcionou

```bash
# Verificar se o axios está instalado
docker-compose exec backend npm list axios

# Verificar se o servidor está rodando
curl http://localhost:5000/health
```

## 📝 Notas

- O `axios` já está no `package.json`, mas precisa ser instalado no container
- O Docker usa volumes para sincronizar código, mas `node_modules` fica no container
- Sempre que adicionar uma nova dependência, reconstrua o container ou instale dentro dele

