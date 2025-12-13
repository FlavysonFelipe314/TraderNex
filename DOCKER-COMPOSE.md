# Docker Compose — Instruções para rodar o projeto

Pré-requisitos
- Docker (Engine) instalado
- Docker Compose (embutido no Docker Desktop ou CLI) — versão compatível com Compose v2

Passo a passo

1) Na raiz do repositório, construa e suba os serviços:

```bash
docker compose up --build -d
```

2) Verifique os logs (opcional):

```bash
docker compose logs -f backend
```

3) Endpoints (padrões usados neste compose):
- Backend: http://localhost:5000
  - Health: http://localhost:5000/health
  - Swagger: http://localhost:5000/api-docs
- Frontend: http://localhost:5174

4) Inicializar schema e dados do banco (uma vez, após o Postgres estar saudável):

```bash
# Executa o script de inicialização do banco dentro do container do backend
docker compose exec backend node src/config/initDB.js
```

5) Parar e remover tudo (incluindo volumes):

```bash
docker compose down -v
```

Observações
- O serviço `db` usa as variáveis: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=admin`, `POSTGRES_DB=tradernex`.
- O backend lê variáveis do arquivo `backend/.env` e as sobrescreve conforme necessário via Compose (DB_HOST apontando para o serviço `db`).
- Se quiser mudar portas, edite `docker-compose.yml` e atualize `FRONTEND_URL` no `backend/.env` quando necessário.

Notas de debug
- Se você ver o aviso: "the attribute `version` is obsolete", remova a linha `version:` (já atualizado neste repositório).
- Se o frontend retorna 502 em chamadas a `/api`, verifique se o `proxy_pass` em `frontend/nginx.conf` aponta para a mesma porta que o backend (no projeto usamos `backend:5000`).
- Após alterar `nginx.conf` ou o build do frontend, reconstrua a imagem do frontend:

```bash
# Reconstruir só o frontend (aplica novo nginx.conf):
docker compose up --build -d frontend
```

