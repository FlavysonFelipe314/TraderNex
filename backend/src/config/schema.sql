-- ============================================================================
-- TraderNex Database Schema (MySQL)
-- ============================================================================
-- 
-- Este schema define todas as tabelas, índices e constraints
-- necessários para o funcionamento completo da aplicação TraderNex.
--
-- Adaptado de PostgreSQL para MySQL:
-- - UUID gerado via UUID() (CHAR(36))
-- - BOOLEAN → TINYINT(1)
-- - SERIAL → AUTO_INCREMENT (não usado, usamos UUID)
-- - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- - Triggers para updated_at
-- - CHECK constraints (suportadas no MySQL 8.0.16+)
-- ============================================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    email_verified TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    is_admin TINYINT(1) DEFAULT 0
);

-- Tabela de Perfis de Cliente
CREATE TABLE IF NOT EXISTS client_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    account_type VARCHAR(50) DEFAULT 'Basic',
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_invested DECIMAL(15, 2) DEFAULT 0.00,
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    profit_percentage DECIMAL(5, 2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE,
    referred_by CHAR(36),
    selected_plan_id CHAR(36),
    plan_status VARCHAR(20) DEFAULT NULL,
    plan_reviewed_at TIMESTAMP NULL DEFAULT NULL,
    plan_reviewed_by CHAR(36) DEFAULT NULL,
    plan_review_notes TEXT DEFAULT NULL,
    street VARCHAR(255),
    `number` VARCHAR(20),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    complement VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Planos de Investimento (criada antes de referências)
CREATE TABLE IF NOT EXISTS investment_plans (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    min_investment DECIMAL(15, 2) NOT NULL,
    max_investment DECIMAL(15, 2),
    expected_return DECIMAL(5, 2),
    duration_days INTEGER,
    risk_level VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    profit_fee_percentage DECIMAL(5, 2) DEFAULT 0.00,
    benefits TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (min_investment > 0),
    CHECK (max_investment IS NULL OR max_investment >= min_investment),
    CHECK (expected_return IS NULL OR (expected_return >= 0 AND expected_return <= 100)),
    CHECK (duration_days IS NULL OR duration_days > 0),
    CHECK (risk_level IS NULL OR risk_level IN ('Low', 'Medium', 'High')),
    CHECK (profit_fee_percentage >= 0 AND profit_fee_percentage <= 100)
);

-- FK do selected_plan_id após investment_plans existir
ALTER TABLE client_profiles 
ADD CONSTRAINT fk_client_profiles_plan 
FOREIGN KEY (selected_plan_id) REFERENCES investment_plans(id) ON DELETE SET NULL;

-- Tabela de Contas MT4
CREATE TABLE IF NOT EXISTS mt4_accounts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(100),
    broker VARCHAR(100),
    server VARCHAR(100),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    equity DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    connected_at TIMESTAMP NULL DEFAULT NULL,
    last_sync TIMESTAMP NULL DEFAULT NULL,
    myfxbook_integration_login VARCHAR(100),
    automation_enabled TINYINT(1) DEFAULT 1,
    risk_profile VARCHAR(20) DEFAULT 'moderado',
    encrypted_password TEXT DEFAULT NULL,
    credentials_status VARCHAR(20) DEFAULT NULL,
    credentials_reviewed_at TIMESTAMP NULL DEFAULT NULL,
    credentials_reviewed_by CHAR(36) DEFAULT NULL,
    credentials_review_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_account (user_id, account_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'))
);

-- Tabela de Conexões Myfxbook
CREATE TABLE IF NOT EXISTS myfxbook_connections (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT DEFAULT NULL,
    session_id VARCHAR(255),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Investimentos do Usuário
CREATE TABLE IF NOT EXISTS user_investments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    plan_id CHAR(36),
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL DEFAULT NULL,
    current_value DECIMAL(15, 2),
    profit DECIMAL(15, 2) DEFAULT 0.00,
    last_weekly_profit DECIMAL(15, 2) DEFAULT 0.00,
    last_weekly_processed_date TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES investment_plans(id),
    CHECK (amount > 0),
    CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (type IN ('deposit', 'withdrawal', 'profit', 'fee', 'referral_bonus')),
    CHECK (amount != 0),
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Tabela de Faturas
CREATE TABLE IF NOT EXISTS invoices (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    profit_amount DECIMAL(15, 2),
    fee_percentage DECIMAL(5, 2),
    plan_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (amount > 0),
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

-- Tabela de Relatórios de Performance
CREATE TABLE IF NOT EXISTS performance_reports (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    report_date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    total_loss DECIMAL(15, 2) DEFAULT 0.00,
    net_profit DECIMAL(15, 2) DEFAULT 0.00,
    roi DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_report_date (user_id, report_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (total_trades >= 0),
    CHECK (winning_trades >= 0),
    CHECK (losing_trades >= 0),
    CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- Tabela de Referências
CREATE TABLE IF NOT EXISTS referrals (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    referrer_id CHAR(36),
    referred_id CHAR(36),
    commission DECIMAL(15, 2) DEFAULT 0.00,
    commission_paid TINYINT(1) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    investment_amount DECIMAL(15, 2),
    profit_amount DECIMAL(15, 2),
    broker_fee_percentage DECIMAL(5, 2),
    broker_profit DECIMAL(15, 2),
    last_commission_date TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_referrer_referred (referrer_id, referred_id),
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (commission >= 0),
    CHECK (status IN ('active', 'inactive'))
);

-- Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS support_tickets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Tabela de Respostas de Suporte
CREATE TABLE IF NOT EXISTS support_responses (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ticket_id CHAR(36),
    user_id CHAR(36),
    message TEXT NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Tokens de Reset de Senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Configuração MyFXBook do Sistema
CREATE TABLE IF NOT EXISTS system_myfxbook_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabela de Interessados em Cripto
CREATE TABLE IF NOT EXISTS crypto_interested (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    investment_amount DECIMAL(15,2),
    experience_level VARCHAR(50),
    preferred_cryptos TEXT,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_referral_code ON client_profiles(referral_code);
CREATE INDEX idx_client_profiles_selected_plan_id ON client_profiles(selected_plan_id);
CREATE INDEX idx_mt4_accounts_user_id ON mt4_accounts(user_id);
CREATE INDEX idx_mt4_accounts_status ON mt4_accounts(status);
CREATE INDEX idx_mt4_accounts_user_status ON mt4_accounts(user_id, status);
CREATE INDEX idx_myfxbook_connections_user_id ON myfxbook_connections(user_id);
CREATE INDEX idx_user_investments_user_id ON user_investments(user_id);
CREATE INDEX idx_user_investments_status ON user_investments(status);
CREATE INDEX idx_user_investments_plan_id ON user_investments(plan_id);
CREATE INDEX idx_user_investments_last_weekly_processed ON user_investments(last_weekly_processed_date);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_profit_amount ON invoices(profit_amount);
CREATE INDEX idx_performance_reports_user_id ON performance_reports(user_id);
CREATE INDEX idx_performance_reports_date ON performance_reports(report_date);
CREATE INDEX idx_performance_reports_user_date ON performance_reports(user_id, report_date);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_last_commission_date ON referrals(last_commission_date);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_responses_ticket_id ON support_responses(ticket_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
