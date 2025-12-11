const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TraderNex API',
      version: '1.0.0',
      description: 'API REST para o sistema TraderNex - Gestão de investimentos Forex e Crypto',
      contact: {
        name: 'TraderNex Team',
        email: 'support@tradernex.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Servidor de desenvolvimento'
      },
      {
        url: 'https://api.tradernex.com',
        description: 'Servidor de produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso'
            },
            data: {
              type: 'object'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email', example: 'usuario@example.com' },
            first_name: { type: 'string', example: 'João' },
            last_name: { type: 'string', example: 'Silva' },
            phone: { type: 'string', example: '+5511999999999' },
            country: { type: 'string', example: 'Brasil' },
            email_verified: { type: 'boolean', example: true },
            account_type: { type: 'string', example: 'Pro' },
            balance: { type: 'number', example: 42350.27 },
            total_invested: { type: 'number', example: 35000.0 },
            total_profit: { type: 'number', example: 2340.1 },
            profit_percentage: { type: 'number', example: 6.8 },
            referral_code: { type: 'string', example: 'TN12345678' },
            street: { type: 'string', example: 'Rua Exemplo' },
            number: { type: 'string', example: '123' },
            neighborhood: { type: 'string', example: 'Centro' },
            city: { type: 'string', example: 'São Paulo' },
            state: { type: 'string', example: 'SP' },
            zip_code: { type: 'string', example: '01234-567' },
            complement: { type: 'string', example: 'Apto 45' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'senha123'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'senha123'
            },
            firstName: {
              type: 'string',
              example: 'João'
            },
            lastName: {
              type: 'string',
              example: 'Silva'
            },
            phone: {
              type: 'string',
              example: '+5511999999999'
            },
            country: {
              type: 'string',
              example: 'BR'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login realizado com sucesso'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        DashboardData: {
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                balance: { type: 'number', example: 42350.27 },
                totalInvested: { type: 'number', example: 35000.0 },
                totalProfit: { type: 'number', example: 2340.1 },
                profitPercentage: { type: 'number', example: 6.8 },
                accountType: { type: 'string', example: 'Pro' }
              }
            },
            mt4Accounts: {
              type: 'object',
              properties: {
                totalAccounts: { type: 'integer', example: 2 },
                totalBalance: { type: 'number', example: 42350.27 },
                totalEquity: { type: 'number', example: 42500.0 }
              }
            },
            recentTransactions: {
              type: 'array',
              items: { type: 'object' }
            },
            investments: {
              type: 'object',
              properties: {
                activeInvestments: { type: 'integer', example: 3 },
                totalInvestedAmount: { type: 'number', example: 35000.0 },
                currentTotalValue: { type: 'number', example: 37340.1 }
              }
            }
          }
        },
        MT4Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            account_number: { type: 'string', example: '82139402' },
            account_name: { type: 'string', example: 'Minha Conta MT4' },
            broker: { type: 'string', example: 'ICMarkets (Live)' },
            server: { type: 'string', example: 'ICMarkets-Live18' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            balance: { type: 'number', example: 42350.27 },
            equity: { type: 'number', example: 42500.0 },
            currency: { type: 'string', example: 'USD' },
            connected_at: { type: 'string', format: 'date-time' },
            last_sync: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação e gerenciamento de usuários'
      },
      {
        name: 'Dashboard',
        description: 'Endpoints do dashboard e dados do usuário'
      },
      {
        name: 'Support',
        description: 'Endpoints de suporte e tickets'
      },
      {
        name: 'Health',
        description: 'Endpoints de verificação de saúde da API'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
