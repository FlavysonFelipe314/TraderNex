-- ============================================================================
-- TraderNex Database Schema
-- ============================================================================
-- 
-- Este schema define todas as tabelas, índices, constraints e triggers
-- necessários para o funcionamento completo da aplicação TraderNex.
--
-- Características:
-- - UUID como chave primária para todas as tabelas
-- - Constraints CHECK para validação de dados
-- - Índices otimizados para queries frequentes
-- - Triggers automáticos para updated_at
-- - Foreign keys com CASCADE para integridade referencial
--
-- Última atualização: Inclui campos de endereço, constraints e índices
-- ============================================================================

-- Nota: Usamos gen_random_uuid() que é nativo do PostgreSQL 13+ e não requer extensão
-- Isso evita problemas de permissões em ambientes restritos

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Tabela de Perfis de Cliente
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    account_type VARCHAR(50) DEFAULT 'Basic', -- Basic, Pro, Premium
    balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    total_invested DECIMAL(15, 2) DEFAULT 0.00 CHECK (total_invested >= 0),
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    profit_percentage DECIMAL(5, 2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    -- Campos de endereço
    street VARCHAR(255),
    number VARCHAR(20),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    complement VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Contas MT4
CREATE TABLE IF NOT EXISTS mt4_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(100),
    broker VARCHAR(100),
    server VARCHAR(100),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    equity DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    connected_at TIMESTAMP,
    last_sync TIMESTAMP,
    myfxbook_integration_login VARCHAR(100),
    automation_enabled BOOLEAN DEFAULT TRUE,
    risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, account_number) -- Um usuário não pode ter a mesma conta MT4 duplicada
);

-- Tabela de Conexões Myfxbook
CREATE TABLE IF NOT EXISTS myfxbook_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Planos de Investimento
CREATE TABLE IF NOT EXISTS investment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    min_investment DECIMAL(15, 2) NOT NULL CHECK (min_investment > 0),
    max_investment DECIMAL(15, 2) CHECK (max_investment IS NULL OR max_investment >= min_investment),
    expected_return DECIMAL(5, 2) CHECK (expected_return >= 0 AND expected_return <= 100), -- Percentual
    duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
    risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Investimentos do Usuário
CREATE TABLE IF NOT EXISTS user_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES investment_plans(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    current_value DECIMAL(15, 2),
    profit DECIMAL(15, 2) DEFAULT 0.00,
    last_weekly_profit DECIMAL(15, 2) DEFAULT 0.00,
    last_weekly_processed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'profit', 'fee', 'referral_bonus')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount != 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Faturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    profit_amount DECIMAL(15, 2),
    fee_percentage DECIMAL(5, 2),
    plan_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    paid_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relatórios de Performance
CREATE TABLE IF NOT EXISTS performance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
    winning_trades INTEGER DEFAULT 0 CHECK (winning_trades >= 0),
    losing_trades INTEGER DEFAULT 0 CHECK (losing_trades >= 0),
    win_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (win_rate >= 0 AND win_rate <= 100),
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    total_loss DECIMAL(15, 2) DEFAULT 0.00,
    net_profit DECIMAL(15, 2) DEFAULT 0.00,
    roi DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_date) -- Um relatório por usuário por data
);

-- Tabela de Referências
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    commission DECIMAL(15, 2) DEFAULT 0.00 CHECK (commission >= 0),
    commission_paid BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    -- Campos detalhados de comissão
    investment_amount DECIMAL(15, 2),
    profit_amount DECIMAL(15, 2),
    broker_fee_percentage DECIMAL(5, 2),
    broker_profit DECIMAL(15, 2),
    last_commission_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_id, referred_id) -- Um usuário não pode ser referido duas vezes pela mesma pessoa
);

-- Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Respostas de Suporte
CREATE TABLE IF NOT EXISTS support_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tokens de Reset de Senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_referral_code ON client_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_mt4_accounts_user_id ON mt4_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mt4_accounts_status ON mt4_accounts(status);
CREATE INDEX IF NOT EXISTS idx_mt4_accounts_user_status ON mt4_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_myfxbook_connections_user_id ON myfxbook_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_status ON user_investments(status);
CREATE INDEX IF NOT EXISTS idx_user_investments_plan_id ON user_investments(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_last_weekly_processed ON user_investments(last_weekly_processed_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_profit_amount ON invoices(profit_amount);
CREATE INDEX IF NOT EXISTS idx_performance_reports_user_id ON performance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_reports_date ON performance_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_performance_reports_user_date ON performance_reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_last_commission_date ON referrals(last_commission_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_responses_ticket_id ON support_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mt4_accounts_updated_at ON mt4_accounts;
CREATE TRIGGER update_mt4_accounts_updated_at BEFORE UPDATE ON mt4_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_myfxbook_connections_updated_at ON myfxbook_connections;
CREATE TRIGGER update_myfxbook_connections_updated_at BEFORE UPDATE ON myfxbook_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investment_plans_updated_at ON investment_plans;
CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON investment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_investments_updated_at ON user_investments;
CREATE TRIGGER update_user_investments_updated_at BEFORE UPDATE ON user_investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
