# 🔍 Debug - Frontend Conta Forex MT4

## Problemas Relatados

1. ❌ Botão "Conectar Myfxbook" não aparece
2. ❌ Dados reais da conta MT4 não aparecem

## ✅ Correções Aplicadas

1. ✅ Dados reais da conta MT4 agora são exibidos (não mais hardcoded)
2. ✅ Botão "Conectar Myfxbook" sempre visível
3. ✅ Mensagem quando não há conta cadastrada
4. ✅ Logs de debug adicionados no console

## 🔍 Como Verificar

### 1. Abra o Console do Navegador

1. Abra `http://localhost:3000/conta-forex-mt4`
2. Pressione `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Vá na aba **Console**

### 2. Verifique os Logs

Você deve ver mensagens como:
```
Resultado getMT4Accounts: {success: true, data: [...]}
Contas MT4 carregadas: [...]
Resultado getMyfxbookStatus: {success: true, data: {...}}
```

### 3. Verifique se há Erros

Se houver erros no console, eles aparecerão em vermelho. Possíveis erros:

- **404 ou 500**: Backend não está respondendo
- **CORS**: Problema de configuração
- **Network Error**: Backend não está rodando

### 4. Verifique a Rede (Network Tab)

1. Na aba **Network** do DevTools
2. Recarregue a página (`F5`)
3. Procure por requisições para:
   - `/api/dashboard/mt4-accounts`
   - `/api/myfxbook/status`

Verifique:
- ✅ Status 200 = Sucesso
- ❌ Status 404/500 = Erro no backend
- ❌ (failed) = Backend não está rodando

## 🛠️ Soluções Comuns

### Problema: Botão não aparece

**Causa**: Erro JavaScript impedindo renderização

**Solução**:
1. Verifique o console por erros
2. Verifique se o backend está rodando: `curl http://localhost:5000/health`
3. Limpe o cache do navegador (`Ctrl+Shift+Delete`)

### Problema: Dados não aparecem

**Causa**: Backend não retornando dados ou erro na requisição

**Solução**:
1. Verifique se há contas MT4 cadastradas:
   ```bash
   docker-compose exec backend node -e "const pool = require('./src/config/database'); pool.query('SELECT * FROM mt4_accounts LIMIT 5').then(r => console.log(r.rows)).catch(e => console.error(e)).finally(() => process.exit())"
   ```

2. Verifique se a API está funcionando:
   ```bash
   curl http://localhost:5000/api/dashboard/mt4-accounts -H "Authorization: Bearer SEU_TOKEN"
   ```

### Problema: Erro 401 (Não autorizado)

**Causa**: Token JWT inválido ou expirado

**Solução**:
1. Faça logout e login novamente
2. Verifique se o token está sendo salvo no localStorage:
   ```javascript
   // No console do navegador:
   localStorage.getItem('token')
   ```

## 📋 Checklist de Verificação

- [ ] Backend está rodando (`docker-compose ps`)
- [ ] Frontend está rodando (`http://localhost:3000`)
- [ ] Console não mostra erros JavaScript
- [ ] Requisições na aba Network retornam 200
- [ ] Token JWT está presente no localStorage
- [ ] Dados aparecem no console (logs de debug)

## 🎯 Próximos Passos

1. Abra o console do navegador
2. Recarregue a página `/conta-forex-mt4`
3. Envie os logs do console para análise
4. Verifique se o botão aparece agora

## 💡 Dica

Se o botão ainda não aparecer, tente:
1. Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. Limpar cache do navegador
3. Abrir em modo anônimo/privado

