const crypto = require('crypto');

// Chave de criptografia (usar variável de ambiente em produção)
// Se não tiver chave no .env, gerar uma e salvar (para persistência entre reinícios)
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  // Gerar chave de 32 bytes (256 bits) para AES-256
  ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('[Encryption] AVISO: ENCRYPTION_KEY não encontrada no .env. Gerando chave temporária.');
  console.warn('[Encryption] Adicione ENCRYPTION_KEY ao .env para manter a criptografia entre reinícios.');
}

// Garantir que a chave tem 32 bytes (64 caracteres hex)
if (ENCRYPTION_KEY.length < 64) {
  // Preencher ou truncar para 32 bytes
  ENCRYPTION_KEY = ENCRYPTION_KEY.padEnd(64, '0').substring(0, 64);
}

const ALGORITHM = 'aes-256-cbc';

// Função auxiliar para obter chave como Buffer
function getKeyBuffer() {
  return Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
}

/**
 * Criptografa um texto usando AES-256-CBC
 * @param {string} text - Texto a ser criptografado
 * @returns {string} Texto criptografado no formato iv:encryptedText
 */
function encrypt(text) {
  try {
    if (!text) {
      throw new Error('Texto vazio não pode ser criptografado');
    }
    const iv = crypto.randomBytes(16);
    const key = getKeyBuffer();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[Encryption] Erro ao criptografar:', error);
    throw error;
  }
}

/**
 * Descriptografa um texto criptografado
 * @param {string} encryptedText - Texto no formato iv:encryptedText
 * @returns {string} Texto descriptografado
 */
function decrypt(encryptedText) {
  try {
    if (!encryptedText) {
      throw new Error('Texto criptografado vazio');
    }
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de texto criptografado inválido');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = getKeyBuffer();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Erro ao descriptografar:', error);
    throw error;
  }
}

module.exports = {
  encrypt,
  decrypt
};

