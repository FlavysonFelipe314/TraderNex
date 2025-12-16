// Mock do pool de conexão do banco de dados
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
};

module.exports = mockPool;

