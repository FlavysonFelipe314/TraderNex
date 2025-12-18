// Mock do serviço de email
const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue({ 
    success: true, 
    messageId: 'mock-message-id' 
  }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ 
    success: true, 
    messageId: 'mock-message-id' 
  })
};

module.exports = mockEmailService;






