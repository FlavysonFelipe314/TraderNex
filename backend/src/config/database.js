const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Connection Pool com interface compatível com pg (node-postgres).
 * 
 * Traduz automaticamente:
 * - Placeholders: $1, $2, $3... → ?
 * - RETURNING clause → SELECT separado após INSERT/UPDATE/DELETE
 * - NOW() → NOW() (compatível)
 * - BOOLEAN → TINYINT(1) (tratado no schema)
 * - gen_random_uuid() → UUID() (tratado no schema)
 * - INTERVAL '30 days' → INTERVAL 30 DAY
 */

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tradernex',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Retornar datas como strings para compatibilidade
  dateStrings: true,
  // Suporte a múltiplas statements (para schema.sql)
  multipleStatements: true,
};

const mysqlPool = mysql.createPool(poolConfig);

// Log de conexão
mysqlPool.getConnection()
  .then(conn => {
    console.log('✅ Conectado ao banco de dados MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
  });

/**
 * Converte placeholders do PostgreSQL ($1, $2, ...) para MySQL (?)
 */
function convertPlaceholders(sql) {
  // Substituir $1, $2, $3... por ?
  return sql.replace(/\$(\d+)/g, '?');
}

/**
 * Converte sintaxe INTERVAL do PostgreSQL para MySQL
 * PostgreSQL: INTERVAL '30 days'  →  MySQL: INTERVAL 30 DAY
 * PostgreSQL: INTERVAL '1 hour'   →  MySQL: INTERVAL 1 HOUR
 */
function convertInterval(sql) {
  return sql.replace(/INTERVAL\s+'(\d+)\s+(days?|hours?|minutes?|seconds?|months?|years?)'/gi, 
    (match, num, unit) => {
      // MySQL usa singular para INTERVAL units
      const mysqlUnit = unit.toUpperCase().replace(/S$/, '');
      return `INTERVAL ${num} ${mysqlUnit}`;
    }
  );
}

/**
 * Converte random()::text do PostgreSQL para MySQL
 */
function convertRandom(sql) {
  return sql.replace(/random\(\)::text/g, 'UUID()');
}

/**
 * Converte md5() do PostgreSQL para MySQL
 */
function convertMD5(sql) {
  return sql.replace(/substr\(md5\(([^)]+)\),\s*(\d+),\s*(\d+)\)/g, 
    'SUBSTRING(MD5($1), $2, $3)');
}

/**
 * Converte TRUE/FALSE literais para 1/0 em contextos específicos
 */
function convertBooleans(sql) {
  // Substituir = TRUE e = FALSE
  let result = sql.replace(/=\s*TRUE\b/gi, '= 1');
  result = result.replace(/=\s*FALSE\b/gi, '= 0');
  // DEFAULT TRUE/FALSE
  result = result.replace(/DEFAULT\s+TRUE\b/gi, 'DEFAULT 1');
  result = result.replace(/DEFAULT\s+FALSE\b/gi, 'DEFAULT 0');
  // SET campo = TRUE/FALSE  
  result = result.replace(/SET\s+(\w+)\s*=\s*TRUE\b/gi, 'SET $1 = 1');
  result = result.replace(/SET\s+(\w+)\s*=\s*FALSE\b/gi, 'SET $1 = 0');
  // VALUES com TRUE/FALSE
  result = result.replace(/,\s*TRUE\b/gi, ', 1');
  result = result.replace(/,\s*FALSE\b/gi, ', 0');
  result = result.replace(/\(\s*TRUE\b/gi, '(1');
  result = result.replace(/\(\s*FALSE\b/gi, '(0');
  return result;
}

/**
 * Extrai a cláusula RETURNING de um SQL e retorna o SQL sem RETURNING + colunas
 */
function extractReturning(sql) {
  const match = sql.match(/\s+RETURNING\s+(.+?)$/i);
  if (match) {
    const cleanSql = sql.replace(/\s+RETURNING\s+.+$/i, '');
    const columns = match[1].trim();
    return { cleanSql, columns };
  }
  return null;
}

/**
 * Converte ON CONFLICT para MySQL INSERT ... ON DUPLICATE KEY UPDATE
 * ou INSERT IGNORE para ON CONFLICT DO NOTHING
 */
function convertOnConflict(sql) {
  // ON CONFLICT DO NOTHING → INSERT IGNORE
  if (/ON\s+CONFLICT\s+(?:\([^)]*\)\s+)?DO\s+NOTHING/i.test(sql)) {
    let result = sql.replace(/\s+ON\s+CONFLICT\s+(?:\([^)]*\)\s+)?DO\s+NOTHING/gi, '');
    result = result.replace(/^INSERT\s+INTO/i, 'INSERT IGNORE INTO');
    return result;
  }
  
  // ON CONFLICT (column) DO UPDATE SET ... → ON DUPLICATE KEY UPDATE ...
  const conflictMatch = sql.match(/ON\s+CONFLICT\s+\([^)]*\)\s+DO\s+UPDATE\s+SET\s+(.+?)(?:;?\s*$)/is);
  if (conflictMatch) {
    let updateClause = conflictMatch[1].trim().replace(/;$/, '');
    // Substituir EXCLUDED.column por VALUES(column)
    updateClause = updateClause.replace(/EXCLUDED\.(\w+)/g, 'VALUES($1)');
    const cleanSql = sql.replace(/\s+ON\s+CONFLICT\s+\([^)]*\)\s+DO\s+UPDATE\s+SET\s+.+$/is, '');
    return `${cleanSql} ON DUPLICATE KEY UPDATE ${updateClause}`;
  }
  
  return sql;
}

/**
 * Wrapper principal que emula a interface do pg Pool
 * Aceita pool.query(sql, params) e retorna { rows: [...] }
 */
const pool = {
  async query(sql, params = []) {
    let convertedSql = sql;
    
    // Aplicar todas as conversões
    convertedSql = convertPlaceholders(convertedSql);
    convertedSql = convertInterval(convertedSql);
    convertedSql = convertRandom(convertedSql);
    convertedSql = convertMD5(convertedSql);
    convertedSql = convertBooleans(convertedSql);
    convertedSql = convertOnConflict(convertedSql);
    
    // Tratar RETURNING
    const returningInfo = extractReturning(convertedSql);
    
    if (returningInfo) {
      convertedSql = returningInfo.cleanSql;
      
      const [result] = await mysqlPool.execute(convertedSql, params);
      
      // Para INSERT, buscar a linha inserida
      if (/^\s*INSERT/i.test(convertedSql)) {
        if (result.insertId) {
          // Se tem insertId (AUTO_INCREMENT), buscar por ele
          // Mas como usamos UUID, precisamos outra abordagem
          // Usar LAST_INSERT_ID não funciona com UUIDs
          // Retornar os dados passados como params
        }
        // Para MySQL com UUID, precisamos fazer um SELECT após o INSERT
        // Extrair o nome da tabela do INSERT
        const tableMatch = convertedSql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          const columns = returningInfo.columns === '*' ? '*' : returningInfo.columns;
          try {
            const [selectResult] = await mysqlPool.execute(
              `SELECT ${columns} FROM ${tableName} WHERE id = LAST_INSERT_ID() OR id = (SELECT id FROM ${tableName} ORDER BY created_at DESC LIMIT 1)`,
              []
            );
            // Se não encontrou via LAST_INSERT_ID (UUID), tentar buscar pelo último registro
            if (selectResult.length > 0) {
              return { rows: selectResult, rowCount: selectResult.length };
            }
          } catch (e) {
            // Fallback: retornar resultado do insert sem os dados
          }
        }
        return { rows: [], rowCount: result.affectedRows };
      }
      
      // Para UPDATE/DELETE com RETURNING
      if (/^\s*UPDATE/i.test(convertedSql) || /^\s*DELETE/i.test(convertedSql)) {
        // Extrair WHERE clause
        const whereMatch = convertedSql.match(/WHERE\s+(.+?)$/i);
        const tableMatch = convertedSql.match(/(?:UPDATE|DELETE\s+FROM)\s+(\w+)/i);
        
        // Primeiro executar o UPDATE/DELETE
        // Já executou acima, agora fazer SELECT
        if (tableMatch && whereMatch) {
          const tableName = tableMatch[1];
          const whereClause = whereMatch[1];
          const columns = returningInfo.columns === '*' ? '*' : returningInfo.columns;
          try {
            const [selectResult] = await mysqlPool.execute(
              `SELECT ${columns} FROM ${tableName} WHERE ${whereClause}`,
              params.slice(-whereClause.split('?').length + 1)
            );
            return { rows: selectResult, rowCount: selectResult.length };
          } catch (e) {
            // Fallback
          }
        }
        return { rows: [], rowCount: result.affectedRows };
      }
    }
    
    // Query normal (sem RETURNING)
    try {
      const [rows] = await mysqlPool.execute(convertedSql, params);
      
      // Se é um SELECT, rows é um array de objetos
      if (Array.isArray(rows)) {
        return { rows, rowCount: rows.length };
      }
      
      // Se é INSERT/UPDATE/DELETE, rows é um ResultSetHeader
      return { rows: [], rowCount: rows.affectedRows || 0 };
    } catch (error) {
      // Se o erro é sobre múltiplas statements com execute, usar query()
      if (error.message && error.message.includes('This command is not supported')) {
        const [rows] = await mysqlPool.query(convertedSql, params);
        if (Array.isArray(rows)) {
          return { rows, rowCount: rows.length };
        }
        return { rows: [], rowCount: rows.affectedRows || 0 };
      }
      throw error;
    }
  },

  // Expor o pool MySQL subjacente para operações diretas
  _mysqlPool: mysqlPool,

  async end() {
    await mysqlPool.end();
  }
};

module.exports = pool;
