# Integração MyFXBook - Sistema Centralizado

## Visão Geral

O sistema agora utiliza credenciais padrão do sistema para fazer login no MyFXBook, e cada usuário tem seu `accountId` configurado pelo admin. Quando o usuário acessa o dashboard, o sistema automaticamente busca os dados do MyFXBook usando as credenciais padrão e o `accountId` configurado.

## Como Funciona

1. **Admin configura credenciais padrão do sistema**:
   - Acesse o Painel Admin
   - Clique em "Configurar MyFXBook do Sistema"
   - Informe email e senha da conta MyFXBook do sistema

2. **Admin configura accountId para cada usuário**:
   - No Painel Admin, clique em "MT4" no card do usuário
   - No campo "Login de Integração MyFXBook", informe o `accountId` do MyFXBook
   - Salve

3. **Usuário visualiza dados**:
   - Quando o usuário acessa o dashboard, o sistema automaticamente:
     - Faz login no MyFXBook usando as credenciais padrão
     - Busca os dados da conta usando o `accountId` configurado
     - Exibe os dados no dashboard

## Aplicar Migration

Execute o seguinte SQL no banco de dados:

```sql
-- Adicionar tabela para configurações do sistema MyFXBook
CREATE TABLE IF NOT EXISTS system_myfxbook_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Comentário
COMMENT ON TABLE system_myfxbook_config IS 'Credenciais padrão do sistema para login no MyFXBook';
```

## Endpoints Criados

### Admin

- `POST /api/admin/system/myfxbook-config` - Configurar credenciais padrão
- `GET /api/admin/system/myfxbook-config` - Obter configuração atual
- `GET /api/admin/myfxbook/account/:accountId/data` - Buscar dados por accountId (admin)

### Usuário

- `GET /api/dashboard/myfxbook-data` - Buscar dados MyFXBook do usuário (usa accountId configurado)

## Segurança

- As senhas são criptografadas usando AES-256-CBC
- Apenas admins podem configurar credenciais padrão
- Cada usuário só vê seus próprios dados
- O sistema faz login automaticamente usando credenciais padrão

## Notas Importantes

- O `myfxbook_integration_login` na tabela `mt4_accounts` armazena o `accountId` do MyFXBook
- O sistema usa as credenciais padrão para fazer login uma vez e buscar dados de múltiplas contas
- Se o `accountId` não estiver configurado, o usuário não verá dados MyFXBook
