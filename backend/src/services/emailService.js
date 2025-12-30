const nodemailer = require('nodemailer');

// Configurar transporter de email
const createTransporter = () => {
  console.log('[emailService] Verificando configuração SMTP...');
  console.log(`[emailService] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[emailService] SMTP_HOST: ${process.env.SMTP_HOST || 'não definido'}`);
  console.log(`[emailService] SMTP_USER: ${process.env.SMTP_USER ? 'definido' : 'não definido'}`);
  console.log(`[emailService] SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'definido' : 'não definido'}`);
  
  // Se SMTP_HOST estiver configurado, usar SMTP real
  if (process.env.SMTP_HOST) {
    console.log('[emailService] Criando transporter SMTP...');
    
    // Configurações de timeout mais agressivas para evitar esperas longas
    const connectionTimeout = parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '8000', 10); // 8 segundos padrão
    const greetingTimeout = parseInt(process.env.SMTP_GREETING_TIMEOUT || '8000', 10);
    const socketTimeout = parseInt(process.env.SMTP_SOCKET_TIMEOUT || '8000', 10);
    
    console.log(`[emailService] Timeouts configurados: connection=${connectionTimeout}ms, greeting=${greetingTimeout}ms, socket=${socketTimeout}ms`);
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
      requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false', // Requer TLS por padrão
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      // Configurações de timeout para evitar timeouts longos
      connectionTimeout: connectionTimeout,
      greetingTimeout: greetingTimeout,
      socketTimeout: socketTimeout,
      // Retry configuration
      pool: false, // Desabilitar pool para evitar conexões persistentes que podem causar timeout
      // Opções adicionais para melhorar conexão
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' // Rejeitar certificados inválidos por padrão
      }
    });
    console.log('[emailService] Transporter SMTP criado com sucesso');
    return transporter;
  }
  
  // Se não houver SMTP configurado, apenas logar
  console.log('[emailService] SMTP não configurado, emails serão logados no console');
  return null;
};

// Template de email de verificação
const getVerificationEmailTemplate = (name, verificationLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00ff88 0%, #00afaa 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #00ff88 0%, #00afaa 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Bem-vindo ao TraderNex!</h1>
      </div>
      <div class="content">
        <p>Olá ${name},</p>
        <p>Obrigado por se cadastrar na plataforma TraderNex. Para ativar sua conta, por favor, clique no botão abaixo para verificar seu endereço de email:</p>
        <div style="text-align: center;">
          <a href="${verificationLink}" class="button">Verificar Email</a>
        </div>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #00afaa;">${verificationLink}</p>
        <p>Este link expira em 24 horas.</p>
        <p>Se você não criou esta conta, pode ignorar este email.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} TraderNex. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;
};

// Template de email de recuperação de senha
const getPasswordResetEmailTemplate = (name, resetLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00ff88 0%, #00afaa 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #00ff88 0%, #00afaa 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Recuperação de Senha</h1>
      </div>
      <div class="content">
        <p>Olá ${name},</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta TraderNex.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Redefinir Senha</a>
        </div>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #00afaa;">${resetLink}</p>
        <div class="warning">
          <strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email e sua senha permanecerá inalterada.
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} TraderNex. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;
};

// Enviar email de verificação
exports.sendVerificationEmail = async (email, name, token) => {
  try {
    // Forçar uso da variável de ambiente ou usar porta 3000
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL : 'http://localhost:3000';
    console.log(`[emailService] FRONTEND_URL da env: ${process.env.FRONTEND_URL}`);
    console.log(`[emailService] URL final usada: ${frontendUrl}`);
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
    console.log(`[emailService] Link de verificação gerado: ${verificationLink}`);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      // Em desenvolvimento sem SMTP, apenas logar
      console.log('\n═══════════════════════════════════════════');
      console.log('📧 EMAIL DE VERIFICAÇÃO (Desenvolvimento)');
      console.log('═══════════════════════════════════════════');
      console.log(`Para: ${email}`);
      console.log(`Assunto: Verifique seu email - TraderNex`);
      console.log(`Link: ${verificationLink}`);
      console.log('═══════════════════════════════════════════\n');
      return { success: true, message: 'Email logado (modo desenvolvimento)' };
    }

    const mailOptions = {
      from: `"TraderNex" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verifique seu email - TraderNex',
      html: getVerificationEmailTemplate(name, verificationLink)
    };

    // Usar Promise.race para timeout de 12 segundos (reduzido de 15s)
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao enviar email (12s)')), 12000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Email de verificação enviado para ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error.message);
    if (error.code === 'ETIMEDOUT' || error.message.includes('Timeout') || error.command === 'CONN') {
      console.error('   ⚠️  Timeout na conexão SMTP. Possíveis causas:');
      console.error('      - Servidor SMTP não está acessível do container');
      console.error('      - Firewall bloqueando a porta SMTP (587 ou 465)');
      console.error('      - Credenciais incorretas');
      console.error('      - Servidor SMTP sobrecarregado');
      console.error(`   💡 Dica: Verifique se ${process.env.SMTP_HOST} está acessível`);
      console.error('   💡 Dica: Tente usar SMTP_PORT=465 com SMTP_SECURE=true');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Conexão recusada pelo servidor SMTP');
      console.error('      - Verifique se o host e porta estão corretos');
    }
    throw error;
  }
};

// Template de email de aprovação de plano
const getPlanApprovalEmailTemplate = (name, planName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00ff88 0%, #00afaa 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .success {
          background: #d1fae5;
          border-left: 4px solid #059669;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Plano Aprovado! 🎉</h1>
      </div>
      <div class="content">
        <p>Olá ${name},</p>
        <div class="success">
          <strong>✅ Seu plano foi aprovado!</strong>
        </div>
        <p>Temos o prazer de informar que seu plano <strong>${planName}</strong> foi aprovado pelo nosso time administrativo.</p>
        <p>Agora você já pode configurar suas credenciais MT4 e começar a usar a plataforma TraderNex.</p>
        <p>Acesse sua conta para continuar com a configuração:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mt4-config" style="display: inline-block; background: linear-gradient(135deg, #00ff88 0%, #00afaa 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Configurar MT4</a>
        </p>
        <p>Se tiver alguma dúvida, não hesite em entrar em contato com nosso suporte.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} TraderNex. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;
};

// Template de email de rejeição de plano
const getPlanRejectionEmailTemplate = (name, planName, notes) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .warning {
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Plano Não Aprovado</h1>
      </div>
      <div class="content">
        <p>Olá ${name},</p>
        <div class="warning">
          <strong>⚠️ Seu plano não foi aprovado</strong>
        </div>
        <p>Infelizmente, seu plano <strong>${planName}</strong> não foi aprovado pelo nosso time administrativo.</p>
        ${notes ? `<p><strong>Motivo:</strong> ${notes}</p>` : ''}
        <p>Você pode selecionar um novo plano acessando sua conta. Nossa equipe está à disposição para ajudar você a encontrar o plano ideal.</p>
        <p>Entre em contato conosco caso tenha dúvidas ou precise de mais informações.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} TraderNex. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;
};

// Enviar email de aprovação de plano
exports.sendPlanApprovalEmail = async (email, name, planName) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('\n═══════════════════════════════════════════');
      console.log('📧 EMAIL DE APROVAÇÃO DE PLANO (Desenvolvimento)');
      console.log('═══════════════════════════════════════════');
      console.log(`Para: ${email}`);
      console.log(`Assunto: Plano Aprovado - TraderNex`);
      console.log(`Plano: ${planName}`);
      console.log('═══════════════════════════════════════════\n');
      return { success: true, message: 'Email logado (modo desenvolvimento)' };
    }

    const mailOptions = {
      from: `"TraderNex" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Plano Aprovado - TraderNex',
      html: getPlanApprovalEmailTemplate(name, planName)
    };

    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao enviar email (12s)')), 12000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Email de aprovação de plano enviado para ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de aprovação de plano:', error.message);
    throw error;
  }
};

// Enviar email de rejeição de plano
exports.sendPlanRejectionEmail = async (email, name, planName, notes) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('\n═══════════════════════════════════════════');
      console.log('📧 EMAIL DE REJEIÇÃO DE PLANO (Desenvolvimento)');
      console.log('═══════════════════════════════════════════');
      console.log(`Para: ${email}`);
      console.log(`Assunto: Plano Não Aprovado - TraderNex`);
      console.log(`Plano: ${planName}`);
      console.log(`Motivo: ${notes || 'Não especificado'}`);
      console.log('═══════════════════════════════════════════\n');
      return { success: true, message: 'Email logado (modo desenvolvimento)' };
    }

    const mailOptions = {
      from: `"TraderNex" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Plano Não Aprovado - TraderNex',
      html: getPlanRejectionEmailTemplate(name, planName, notes)
    };

    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao enviar email (12s)')), 12000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Email de rejeição de plano enviado para ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de rejeição de plano:', error.message);
    throw error;
  }
};

// Enviar email de recuperação de senha
exports.sendPasswordResetEmail = async (email, name, token) => {
  try {
    // Forçar uso da variável de ambiente ou usar porta 3000
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL : 'http://localhost:3000';
    console.log(`[emailService] FRONTEND_URL da env: ${process.env.FRONTEND_URL}`);
    console.log(`[emailService] URL final usada: ${frontendUrl}`);
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    console.log(`[emailService] Link de reset gerado: ${resetLink}`);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      // Em desenvolvimento sem SMTP, apenas logar
      console.log('\n═══════════════════════════════════════════');
      console.log('📧 EMAIL DE RECUPERAÇÃO DE SENHA (Desenvolvimento)');
      console.log('═══════════════════════════════════════════');
      console.log(`Para: ${email}`);
      console.log(`Assunto: Recuperação de Senha - TraderNex`);
      console.log(`Link: ${resetLink}`);
      console.log('═══════════════════════════════════════════\n');
      return { success: true, message: 'Email logado (modo desenvolvimento)' };
    }

    const mailOptions = {
      from: `"TraderNex" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperação de Senha - TraderNex',
      html: getPasswordResetEmailTemplate(name, resetLink)
    };

    // Usar Promise.race para timeout de 12 segundos (reduzido de 15s)
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao enviar email (12s)')), 12000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Email de recuperação enviado para ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de recuperação:', error.message);
    if (error.code === 'ETIMEDOUT' || error.message.includes('Timeout') || error.command === 'CONN') {
      console.error('   ⚠️  Timeout na conexão SMTP. Possíveis causas:');
      console.error('      - Servidor SMTP não está acessível do container');
      console.error('      - Firewall bloqueando a porta SMTP (587 ou 465)');
      console.error('      - Credenciais incorretas');
      console.error('      - Servidor SMTP sobrecarregado');
      console.error(`   💡 Dica: Verifique se ${process.env.SMTP_HOST} está acessível`);
      console.error('   💡 Dica: Tente usar SMTP_PORT=465 com SMTP_SECURE=true');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Conexão recusada pelo servidor SMTP');
      console.error('      - Verifique se o host e porta estão corretos');
    }
    throw error;
  }
};
