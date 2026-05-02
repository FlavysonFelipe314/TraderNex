const bcrypt = require('bcrypt');
const pool = require('./database');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    const hashedPassword = await bcrypt.hash('senha123', 10);

    // 1. Inserir usuários de exemplo
    console.log('👤 Inserindo usuários...');
    
    // Inserir um por um para pegar os IDs (MySQL não tem RETURNING)
    const usersData = [
      ['admin@tradernex.com', hashedPassword, 'Admin', 'TraderNex', '+5511999999999', 'Brasil', 1, 1],
      ['joao.silva@email.com', hashedPassword, 'João', 'Silva', '+5511988888888', 'Brasil', 1, 1],
      ['maria.santos@email.com', hashedPassword, 'Maria', 'Santos', '+5511977777777', 'Brasil', 1, 1],
      ['pedro.oliveira@email.com', hashedPassword, 'Pedro', 'Oliveira', '+5511966666666', 'Brasil', 0, 1],
      ['ana.costa@email.com', hashedPassword, 'Ana', 'Costa', '+5511955555555', 'Brasil', 1, 1]
    ];

    for (const userData of usersData) {
      await pool.query(`
        INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, country, email_verified, is_active)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
      `, userData);
    }

    console.log(`✅ Usuários inseridos`);

    // Buscar IDs dos usuários
    const users = await pool.query('SELECT id, email FROM users ORDER BY created_at LIMIT 5');
    const adminId = users.rows.find(u => u.email === 'admin@tradernex.com')?.id;
    const joaoId = users.rows.find(u => u.email === 'joao.silva@email.com')?.id;
    const mariaId = users.rows.find(u => u.email === 'maria.santos@email.com')?.id;
    const pedroId = users.rows.find(u => u.email === 'pedro.oliveira@email.com')?.id;
    const anaId = users.rows.find(u => u.email === 'ana.costa@email.com')?.id;

    // Marcar admin
    if (adminId) {
      await pool.query('UPDATE users SET is_admin = 1 WHERE id = ?', [adminId]);
    }

    // 2. Inserir perfis de cliente
    console.log('👥 Inserindo perfis de cliente...');
    const profiles = [
      [adminId, 'Premium', 50000.00, 100000.00, 15000.00, 15.00, null],
      [joaoId, 'Pro', 15000.00, 50000.00, 6000.00, 12.00, adminId],
      [mariaId, 'Basic', 5000.00, 10000.00, 500.00, 5.00, adminId],
      [pedroId, 'Basic', 2000.00, 5000.00, 250.00, 5.00, joaoId],
      [anaId, 'Pro', 8000.00, 25000.00, 3000.00, 12.00, null]
    ];

    for (const [userId, type, balance, invested, profit, percent, referredBy] of profiles) {
      const existing = await pool.query('SELECT id FROM client_profiles WHERE user_id = ?', [userId]);
      if (existing.rows.length === 0) {
        const referralCode = 'TN' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await pool.query(`
          INSERT INTO client_profiles (id, user_id, account_type, balance, total_invested, total_profit, profit_percentage, referral_code, referred_by)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, type, balance, invested, profit, percent, referralCode, referredBy]);
      }
    }

    console.log('✅ Perfis de cliente inseridos');

    // 3. Inserir/atualizar planos de investimento
    console.log('📦 Inserindo planos de investimento...');
    await pool.query(`
      INSERT INTO investment_plans (id, name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active)
      VALUES
        (UUID(), 'Nex Start', 'Plano básico para iniciantes', 1000.00, 10000.00, 5.0, 30, 'Low', 1),
        (UUID(), 'Nex Pro', 'Plano profissional para escala', 5000.00, 100000.00, 8.0, 60, 'Medium', 1),
        (UUID(), 'Nex Prime', 'Plano premium com acompanhamento exclusivo', 10000.00, NULL, 12.0, 90, 'High', 1)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        min_investment = VALUES(min_investment),
        max_investment = VALUES(max_investment),
        expected_return = VALUES(expected_return),
        duration_days = VALUES(duration_days),
        risk_level = VALUES(risk_level),
        is_active = VALUES(is_active);
    `);

    const plans = await pool.query('SELECT id, name FROM investment_plans ORDER BY min_investment');
    const starterPlan = plans.rows.find(p => p.name === 'Nex Start')?.id;
    const professionalPlan = plans.rows.find(p => p.name === 'Nex Pro')?.id;
    const premiumPlan = plans.rows.find(p => p.name === 'Nex Prime')?.id;
    const elitePlan = premiumPlan;

    // 4. Inserir contas MT4
    console.log('💼 Inserindo contas MT4...');
    const mt4Accounts = [
      [adminId, '12345678', 'Conta Principal Admin', 'IC Markets', 'ICMarkets-Demo', 50000.00, 51500.00, 'USD', 'active'],
      [joaoId, '87654321', 'Conta Trading João', 'XM Global', 'XMGlobal-Demo', 15000.00, 15600.00, 'USD', 'active'],
      [mariaId, '11223344', 'Conta Maria', 'FXTM', 'FXTM-Demo', 5000.00, 5250.00, 'USD', 'active'],
      [joaoId, '55667788', 'Conta Secundária João', 'Pepperstone', 'Pepperstone-Demo', 8000.00, 8240.00, 'USD', 'active'],
      [anaId, '99887766', 'Conta Ana', 'AvaTrade', 'AvaTrade-Demo', 8000.00, 8160.00, 'USD', 'inactive']
    ];
    
    for (const [userId, accNum, accName, broker, server, balance, equity, currency, status] of mt4Accounts) {
      const existing = await pool.query('SELECT id FROM mt4_accounts WHERE account_number = ?', [accNum]);
      if (existing.rows.length === 0) {
        const connectedAt = new Date();
        connectedAt.setDate(connectedAt.getDate() - 30);
        const lastSync = new Date();
        lastSync.setHours(lastSync.getHours() - 1);
        
        await pool.query(`
          INSERT INTO mt4_accounts (id, user_id, account_number, account_name, broker, server, balance, equity, currency, status, connected_at, last_sync)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, accNum, accName, broker, server, balance, equity, currency, status, connectedAt, lastSync]);
      }
    }

    console.log('✅ Contas MT4 inseridas');

    // 5. Inserir investimentos
    console.log('💰 Inserindo investimentos...');
    const investments = [
      [adminId, elitePlan, 50000.00, 'active', 60, 30, 57500.00, 7500.00],
      [adminId, premiumPlan, 50000.00, 'completed', 120, -30, 60000.00, 10000.00],
      [joaoId, professionalPlan, 5000.00, 'active', 30, 30, 5300.00, 300.00],
      [joaoId, starterPlan, 1000.00, 'active', 10, 20, 1025.00, 25.00],
      [mariaId, starterPlan, 500.00, 'active', 15, 15, 512.50, 12.50],
      [anaId, professionalPlan, 5000.00, 'active', 20, 40, 5300.00, 300.00]
    ];
    
    for (const [userId, planId, amount, status, daysAgo, daysAhead, currentValue, profit] of investments) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      
      await pool.query(`
        INSERT IGNORE INTO user_investments (id, user_id, plan_id, amount, status, start_date, end_date, current_value, profit)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, planId, amount, status, startDate, endDate, currentValue, profit]);
    }

    console.log('✅ Investimentos inseridos');

    // 6. Inserir transações
    console.log('💳 Inserindo transações...');
    const transactions = [
      [adminId, 'deposit', 50000.00, 'completed', 'Depósito inicial via PIX', 'PIX-001'],
      [adminId, 'profit', 7500.00, 'completed', 'Lucro do Plano Elite', 'PROFIT-001'],
      [joaoId, 'deposit', 10000.00, 'completed', 'Depósito via transferência bancária', 'TRANS-001'],
      [joaoId, 'profit', 300.00, 'completed', 'Lucro do Plano Professional', 'PROFIT-002'],
      [joaoId, 'referral_bonus', 500.00, 'completed', 'Bônus por indicação', 'REF-001'],
      [mariaId, 'deposit', 5000.00, 'completed', 'Depósito via cartão de crédito', 'CC-001'],
      [mariaId, 'profit', 12.50, 'completed', 'Lucro do Plano Starter', 'PROFIT-003'],
      [pedroId, 'deposit', 2000.00, 'pending', 'Depósito pendente', 'PIX-002'],
      [anaId, 'deposit', 8000.00, 'completed', 'Depósito via transferência', 'TRANS-002'],
      [anaId, 'withdrawal', 1000.00, 'completed', 'Saque para conta bancária', 'SAQUE-001']
    ];
    
    for (const [userId, type, amount, status, description, reference] of transactions) {
      await pool.query(`
        INSERT IGNORE INTO transactions (id, user_id, type, amount, status, description, reference)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?)
      `, [userId, type, amount, status, description, reference]);
    }

    console.log('✅ Transações inseridas');

    // 7. Inserir faturas
    console.log('📄 Inserindo faturas...');
    const invoices = [
      [adminId, 'INV-2024-001', 5000.00, 'paid', 10, 8, 'Taxa de administração - Plano Elite'],
      [joaoId, 'INV-2024-002', 500.00, 'paid', 5, 3, 'Taxa de administração - Plano Professional'],
      [joaoId, 'INV-2024-003', 100.00, 'paid', 2, 1, 'Taxa de administração - Plano Starter'],
      [mariaId, 'INV-2024-004', 50.00, 'paid', 1, 0, 'Taxa de administração - Plano Starter'],
      [anaId, 'INV-2024-005', 500.00, 'pending', -5, null, 'Taxa de administração - Plano Professional'],
      [adminId, 'INV-2024-006', 5000.00, 'overdue', 2, null, 'Taxa de administração - Plano Elite']
    ];
    
    for (const [userId, invoiceNumber, amount, status, daysAgo, paidDaysAgo, description] of invoices) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - daysAgo);
      const paidDate = paidDaysAgo !== null ? (() => {
        const date = new Date();
        date.setDate(date.getDate() - paidDaysAgo);
        return date;
      })() : null;
      
      await pool.query(`
        INSERT IGNORE INTO invoices (id, user_id, invoice_number, amount, status, due_date, paid_date, description)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
      `, [userId, invoiceNumber, amount, status, dueDate, paidDate, description]);
    }

    console.log('✅ Faturas inseridas');

    // 8. Inserir relatórios de performance
    console.log('📊 Inserindo relatórios de performance...');
    const reports = [
      [adminId, 7, 150, 95, 55, 63.33, 7500.00, 2500.00, 5000.00, 10.00],
      [adminId, 14, 200, 130, 70, 65.00, 10000.00, 3000.00, 7000.00, 14.00],
      [joaoId, 7, 80, 50, 30, 62.50, 300.00, 100.00, 200.00, 4.00],
      [joaoId, 14, 120, 75, 45, 62.50, 500.00, 200.00, 300.00, 6.00],
      [mariaId, 7, 30, 20, 10, 66.67, 12.50, 5.00, 7.50, 1.50],
      [anaId, 7, 60, 38, 22, 63.33, 300.00, 100.00, 200.00, 4.00]
    ];
    
    for (const [userId, daysAgo, totalTrades, winningTrades, losingTrades, winRate, totalProfit, totalLoss, netProfit, roi] of reports) {
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - daysAgo);
      
      await pool.query(`
        INSERT IGNORE INTO performance_reports (id, user_id, report_date, total_trades, winning_trades, losing_trades, win_rate, total_profit, total_loss, net_profit, roi)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, reportDate, totalTrades, winningTrades, losingTrades, winRate, totalProfit, totalLoss, netProfit, roi]);
    }

    console.log('✅ Relatórios de performance inseridos');

    // 9. Inserir referências
    console.log('🔗 Inserindo referências...');
    const referralData = [
      [adminId, joaoId, 500.00, 1, 'active'],
      [adminId, mariaId, 250.00, 1, 'active'],
      [joaoId, pedroId, 100.00, 0, 'active'],
      [adminId, anaId, 400.00, 1, 'active']
    ];

    for (const [referrerId, referredId, commission, paid, status] of referralData) {
      await pool.query(`
        INSERT IGNORE INTO referrals (id, referrer_id, referred_id, commission, commission_paid, status)
        VALUES (UUID(), ?, ?, ?, ?, ?)
      `, [referrerId, referredId, commission, paid, status]);
    }

    console.log('✅ Referências inseridas');

    // 10. Inserir tickets de suporte
    console.log('🎫 Inserindo tickets de suporte...');
    const tickets = [
      [joaoId, 'Problema ao conectar conta MT4', 'Não consigo conectar minha conta MT4 ao sistema. A conexão fica pendente.', 'open', 'high'],
      [mariaId, 'Dúvida sobre investimento', 'Gostaria de saber mais sobre o Plano Premium. Quais são os riscos?', 'in_progress', 'medium'],
      [joaoId, 'Solicitação de saque', 'Gostaria de solicitar um saque de R$ 1.000,00 para minha conta bancária.', 'resolved', 'medium'],
      [anaId, 'Erro no dashboard', 'O dashboard não está mostrando meus investimentos corretamente.', 'open', 'low'],
      [pedroId, 'Verificação de email', 'Não recebi o email de verificação. Pode reenviar?', 'closed', 'low']
    ];
    
    const insertedTicketIds = [];
    for (const [userId, subject, message, status, priority] of tickets) {
      await pool.query(`
        INSERT IGNORE INTO support_tickets (id, user_id, subject, message, status, priority)
        VALUES (UUID(), ?, ?, ?, ?, ?)
      `, [userId, subject, message, status, priority]);
    }

    // Buscar tickets inseridos
    const ticketsResult = await pool.query('SELECT id, subject FROM support_tickets ORDER BY created_at LIMIT 5');
    console.log(`✅ ${ticketsResult.rows.length} tickets de suporte inseridos`);

    // 11. Inserir respostas de suporte
    if (ticketsResult.rows.length >= 3) {
      const ticket1 = ticketsResult.rows[0]?.id;
      const ticket2 = ticketsResult.rows[1]?.id;
      const ticket3 = ticketsResult.rows[2]?.id;

      if (ticket1 && ticket2 && ticket3) {
        const responses = [
          [ticket1, joaoId, 'Olá! Vamos verificar sua conexão MT4. Por favor, verifique se o servidor está correto.', 0],
          [ticket1, adminId, 'Verificamos sua conta e parece estar tudo correto. Tente desconectar e conectar novamente.', 1],
          [ticket2, mariaId, 'Obrigada pela pergunta! O Plano Premium tem risco alto, mas oferece retornos de até 20%.', 0],
          [ticket2, adminId, 'Segue mais informações sobre o Plano Premium: [detalhes técnicos]', 1],
          [ticket3, joaoId, 'Seu saque foi processado com sucesso! O valor será creditado em até 2 dias úteis.', 0]
        ];
        
        for (const [ticketId, userId, message, isAdmin] of responses) {
          await pool.query(`
            INSERT IGNORE INTO support_responses (id, ticket_id, user_id, message, is_admin)
            VALUES (UUID(), ?, ?, ?, ?)
          `, [ticketId, userId, message, isAdmin]);
        }

        console.log('✅ Respostas de suporte inseridas');
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('   ✅ Seed do banco de dados concluído!');
    console.log('═══════════════════════════════════════════\n');
    console.log('📝 Credenciais de teste:');
    console.log('   Email: admin@tradernex.com');
    console.log('   Senha: senha123');
    console.log('   Email: joao.silva@email.com');
    console.log('   Senha: senha123');
    console.log('   Email: maria.santos@email.com');
    console.log('   Senha: senha123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fazer seed do banco de dados:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
