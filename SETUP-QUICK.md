# ⚡ Setup Rápido - TraderNex

Guia rápido para começar a desenvolver em 5 minutos.

## 🚀 Passos Rápidos

### 1. Clone e Configure

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/tradernex.git
cd tradernex

# Crie o arquivo .env
# Copie o conteúdo de ENV-TEMPLATE.md para .env
# Edite com suas credenciais
```

### 2. Inicie os Containers

```bash
docker-compose up --build
```

### 3. Inicialize o Banco

```bash
# Em outro terminal
docker-compose exec backend npm run init-db
docker-compose exec backend npm run seed
```

### 4. Acesse a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger**: http://localhost:5000/api-docs

## ✅ Pronto!

Agora você pode:
- Registrar um novo usuário
- Fazer login
- Explorar o dashboard

## 🔧 Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Reiniciar um serviço
docker-compose restart backend
```

## 📚 Documentação Completa

Veja [README.md](README.md) para documentação completa.
