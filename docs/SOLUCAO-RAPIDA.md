# 🚀 Solução Rápida - Problemas do Docker

## ⚠️ Problemas Encontrados

1. **Erro: Cannot find module 'axios'** - O axios precisa ser instalado no container Docker
2. **Erro YAML do Swagger** - Já corrigido no código

## ✅ SOLUÇÃO IMEDIATA

### Passo 1: Parar os containers (se estiverem rodando)

```powershell
docker-compose down
```

### Passo 2: Reconstruir o backend sem cache

```powershell
docker-compose build --no-cache backend
```

### Passo 3: Iniciar os containers

```powershell
docker-compose up -d
```

### Passo 4: Verificar se está funcionando

```powershell
# Ver logs do backend
docker-compose logs backend

# Verificar se axios está instalado
docker-compose exec backend npm list axios
```

### Passo 5: Executar a migração do banco

```powershell
docker-compose exec backend npm run migrate
```

## 🔄 Alternativa: Instalar axios no container rodando

Se preferir não reconstruir:

```powershell
# 1. Iniciar containers
docker-compose up -d

# 2. Instalar axios dentro do container
docker-compose exec backend npm install axios

# 3. Reiniciar o backend
docker-compose restart backend
```

## ✅ Verificar se tudo está OK

```powershell
# Testar health check
curl http://localhost:5000/health

# Ver logs em tempo real
docker-compose logs -f backend
```

## 📝 O que foi corrigido

- ✅ Comentário Swagger do `/health` corrigido
- ✅ `axios` adicionado ao `package.json`
- ✅ Script de migração criado (`npm run migrate`)

## 🎯 Próximos Passos

Após resolver os problemas:

1. Execute a migração: `docker-compose exec backend npm run migrate`
2. Teste a conexão Myfxbook em: `http://localhost:3000/conta-forex-mt4`
3. Clique em "Conectar Myfxbook" e insira suas credenciais

