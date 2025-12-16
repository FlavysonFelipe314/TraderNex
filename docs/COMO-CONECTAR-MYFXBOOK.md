# 🚀 Como Conectar sua Conta Myfxbook - Passo a Passo

## ✅ Passo 1: Executar Migração do Banco de Dados

Primeiro, você precisa criar a tabela no banco. Execute este comando:

```powershell
docker-compose exec backend npm run migrate
```

**Se der erro**, execute este comando alternativo:

```powershell
docker-compose exec db psql -U postgres -d tradernex -c "CREATE TABLE IF NOT EXISTS myfxbook_connections (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE, email VARCHAR(255) NOT NULL, session_id VARCHAR(255), connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_myfxbook_connections_user_id ON myfxbook_connections(user_id);"
```

## ✅ Passo 2: Verificar se o Backend está Rodando

```powershell
docker-compose ps
```

Você deve ver `tradernex-backend` com status `Up`.

## ✅ Passo 3: Acessar a Página

1. Abra seu navegador
2. Acesse: `http://localhost:3000/conta-forex-mt4`
3. Faça login se necessário

## ✅ Passo 4: Conectar Myfxbook

1. Na página "Configuração MT4", procure pelo card **"Dados da Conta"**
2. Você verá dois botões:
   - **"Configurar Credenciais"** (verde/azul)
   - **"Conectar Myfxbook"** (azul) ← Este é o botão que você precisa!

3. Clique em **"Conectar Myfxbook"**

4. Uma janela (modal) vai aparecer pedindo:
   - **Email Myfxbook**: Coloque o email da sua conta Myfxbook
   - **Senha Myfxbook**: Coloque a senha da sua conta Myfxbook

5. Clique em **"Conectar"**

6. Aguarde alguns segundos...

7. Se tudo der certo, você verá:
   - ✅ Mensagem de sucesso
   - ✅ O botão muda para "Desconectar Myfxbook" (vermelho)
   - ✅ Suas contas do Myfxbook serão listadas

## ❌ Se Der Erro

### Erro: "Tabela não existe"
- Execute o Passo 1 novamente

### Erro: "Credenciais inválidas"
- Verifique se o email e senha estão corretos
- Teste fazer login no site do Myfxbook para confirmar

### Erro: "Erro de conexão"
- Verifique se o backend está rodando: `docker-compose ps`
- Veja os logs: `docker-compose logs backend`

### Botão não aparece
- Pressione `Ctrl+Shift+R` para recarregar a página
- Abra o Console (F12) e verifique se há erros

## 📋 Checklist Rápido

- [ ] Migração executada (`npm run migrate`)
- [ ] Backend rodando (`docker-compose ps`)
- [ ] Página carregada (`http://localhost:3000/conta-forex-mt4`)
- [ ] Botão "Conectar Myfxbook" visível
- [ ] Email e senha do Myfxbook prontos
- [ ] Clicou em "Conectar Myfxbook"
- [ ] Inseriu email e senha
- [ ] Clicou em "Conectar"
- [ ] ✅ Sucesso!

## 💡 Dica

Se você já tem uma conta Myfxbook:
- Use o mesmo email e senha que você usa para fazer login no site myfxbook.com
- Não precisa criar uma nova conta

## 🎯 Pronto!

Depois de conectar, você poderá:
- Ver suas contas do Myfxbook
- Ver trades abertos
- Ver histórico de trades
- Ver ganhos diários
- E muito mais!

