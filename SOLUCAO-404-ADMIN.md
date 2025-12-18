# 🔧 Solução para Erro 404 ao Acessar /admin

## 🚨 Problema
Ao tentar acessar `localhost:3000/admin`, você recebe um erro **404 - Página não encontrada**.

## ✅ Soluções

### Solução 1: Verificar se o Frontend está Rodando

#### Com Docker:
```powershell
# Verificar se o container está rodando
docker-compose ps

# Se não estiver, iniciar
docker-compose up -d frontend

# Ver logs
docker-compose logs -f frontend
```

#### Sem Docker (desenvolvimento local):
```powershell
cd frontend
npm run dev
```

O frontend deve estar rodando na porta **3000** (conforme `vite.config.js`).

---

### Solução 2: Verificar a Porta Correta

O `vite.config.js` está configurado para porta **3000**, mas verifique:

1. **Qual porta o frontend está usando?**
   - Olhe no terminal onde o `npm run dev` está rodando
   - Ou verifique: `docker-compose ps` e veja a porta mapeada

2. **Acesse a porta correta:**
   - Se for porta 3000: `http://localhost:3000/admin`
   - Se for porta 5173: `http://localhost:5173/admin`
   - Se for porta 5174: `http://localhost:5174/admin`

---

### Solução 3: Reiniciar o Frontend

O frontend precisa ser reiniciado para pegar as mudanças:

#### Com Docker:
```powershell
docker-compose restart frontend
```

#### Sem Docker:
1. Pare o servidor (Ctrl + C)
2. Inicie novamente:
   ```powershell
   cd frontend
   npm run dev
   ```

---

### Solução 4: Limpar Cache do Navegador

1. **Pressione `Ctrl + Shift + R`** (Windows/Linux) ou `Cmd + Shift + R` (Mac)
   - Isso força o reload sem cache

2. **Ou limpe o cache manualmente:**
   - Pressione `F12` para abrir DevTools
   - Clique com botão direito no botão de recarregar
   - Escolha "Limpar cache e recarregar"

---

### Solução 5: Verificar se o Arquivo AdminPage.jsx Existe

```powershell
# Verificar se o arquivo existe
Test-Path frontend\src\page\AdminPage.jsx

# Se não existir, verifique se foi criado corretamente
```

O arquivo deve estar em: `frontend/src/page/AdminPage.jsx`

---

### Solução 6: Verificar Console do Navegador

1. Abra o DevTools (`F12`)
2. Vá na aba **Console**
3. Tente acessar `/admin` novamente
4. Veja se há erros JavaScript

**Erros comuns:**
- `Cannot find module './page/AdminPage'` → Arquivo não encontrado
- `Failed to fetch` → Backend não está rodando
- Erros de sintaxe → Verifique o arquivo AdminPage.jsx

---

### Solução 7: Verificar se Está Logado

A rota `/admin` está protegida. Você precisa:

1. **Estar logado** (ter um token válido)
2. **Ser admin** (`is_admin = TRUE` no banco)

**Teste:**
1. Acesse primeiro: `http://localhost:3000/login`
2. Faça login com um usuário admin
3. Depois acesse: `http://localhost:3000/admin`

---

### Solução 8: Verificar Rotas no App.jsx

O arquivo `frontend/src/App.jsx` deve ter:

```jsx
import AdminPage from "./page/AdminPage";

// E na seção de rotas:
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

Se não tiver, adicione!

---

## 🔍 Diagnóstico Rápido

Execute estes comandos para diagnosticar:

```powershell
# 1. Verificar se o frontend está rodando
docker-compose ps frontend

# 2. Verificar logs do frontend
docker-compose logs frontend --tail=50

# 3. Verificar se o arquivo existe
Test-Path frontend\src\page\AdminPage.jsx

# 4. Verificar se o backend está rodando
docker-compose ps backend

# 5. Testar se a API responde
curl http://localhost:5000/health
```

---

## ✅ Checklist de Verificação

- [ ] Frontend está rodando (porta 3000, 5173 ou 5174)
- [ ] Arquivo `AdminPage.jsx` existe em `frontend/src/page/`
- [ ] Rota `/admin` está no `App.jsx`
- [ ] Frontend foi reiniciado após as mudanças
- [ ] Cache do navegador foi limpo
- [ ] Está logado como usuário admin
- [ ] Backend está rodando
- [ ] Não há erros no console do navegador

---

## 🚀 Solução Rápida (Tente Esta Primeiro)

```powershell
# 1. Parar tudo
docker-compose down

# 2. Reconstruir e iniciar
docker-compose up -d --build

# 3. Verificar logs
docker-compose logs -f frontend

# 4. Acessar no navegador
# http://localhost:3000/admin
# (ou a porta que aparecer nos logs)
```

---

## 📞 Se Nada Funcionar

1. **Verifique os logs completos:**
   ```powershell
   docker-compose logs frontend > frontend-logs.txt
   docker-compose logs backend > backend-logs.txt
   ```

2. **Verifique se todas as dependências estão instaladas:**
   ```powershell
   cd frontend
   npm install
   ```

3. **Tente acessar outras rotas para ver se o problema é geral:**
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/login`

4. **Verifique se o React Router está funcionando:**
   - Tente navegar pelo Sidebar em vez de digitar a URL

---

## 💡 Dica

Se você estiver usando **Docker**, certifique-se de que:
- Os volumes estão montados corretamente
- O hot reload está funcionando
- Os arquivos foram salvos corretamente

Se estiver em **desenvolvimento local**, certifique-se de:
- Ter executado `npm install` no frontend
- O servidor Vite está rodando
- A porta não está sendo usada por outro processo
