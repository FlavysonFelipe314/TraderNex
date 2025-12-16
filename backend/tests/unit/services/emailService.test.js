const nodemailer = require('nodemailer');
const emailService = require('../../../src/services/emailService');

jest.mock('nodemailer');

describe('EmailService', () => {
  let mockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = undefined;
    process.env.FRONTEND_URL = 'http://localhost:3000';

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id'
      })
    };

    nodemailer.createTransporter.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
  });

  describe('sendVerificationEmail', () => {
    it('deve enviar email de verificação com SMTP configurado', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.SMTP_FROM = 'noreply@example.com';

      const result = await emailService.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'verification-token'
      );

      expect(nodemailer.createTransporter).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Verifique seu email - TraderNex',
          from: expect.stringContaining('TraderNex')
        })
      );
      expect(result.success).toBe(true);
    });

    it('deve logar email em modo desenvolvimento sem SMTP', async () => {
      delete process.env.SMTP_HOST;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await emailService.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'verification-token'
      );

      expect(nodemailer.createTransporter).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toContain('modo desenvolvimento');

      consoleSpy.mockRestore();
    });

    it('deve tratar erros ao enviar email', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        emailService.sendVerificationEmail(
          'test@example.com',
          'John Doe',
          'verification-token'
        )
      ).rejects.toThrow('SMTP Error');
    });

    it('deve usar FRONTEND_URL do ambiente', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.FRONTEND_URL = 'https://app.example.com';

      await emailService.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'verification-token'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://app.example.com')
        })
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('deve enviar email de recuperação de senha com SMTP configurado', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASSWORD = 'password';

      const result = await emailService.sendPasswordResetEmail(
        'test@example.com',
        'John Doe',
        'reset-token'
      );

      expect(nodemailer.createTransporter).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Recuperação de Senha - TraderNex',
          from: expect.stringContaining('TraderNex')
        })
      );
      expect(result.success).toBe(true);
    });

    it('deve logar email em modo desenvolvimento sem SMTP', async () => {
      delete process.env.SMTP_HOST;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await emailService.sendPasswordResetEmail(
        'test@example.com',
        'John Doe',
        'reset-token'
      );

      expect(nodemailer.createTransporter).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toContain('modo desenvolvimento');

      consoleSpy.mockRestore();
    });

    it('deve tratar erros ao enviar email', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        emailService.sendPasswordResetEmail(
          'test@example.com',
          'John Doe',
          'reset-token'
        )
      ).rejects.toThrow('SMTP Error');
    });

    it('deve usar FRONTEND_URL do ambiente', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.FRONTEND_URL = 'https://app.example.com';

      await emailService.sendPasswordResetEmail(
        'test@example.com',
        'John Doe',
        'reset-token'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://app.example.com')
        })
      );
    });
  });
});

