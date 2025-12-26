/**
 * Sistema de cache para dados do MyFXBook
 * Armazena dados no localStorage e renova automaticamente à meia-noite
 * Cache é específico por usuário para evitar vazamento de dados entre contas
 */

/**
 * Obtém as chaves do cache baseadas no userId
 * @param {string} userId - ID do usuário atual
 * @returns {Object} Objeto com as chaves do cache
 */
function getCacheKeys(userId) {
  if (!userId) {
    throw new Error('userId é obrigatório para o cache')
  }
  return {
    cache: `myfxbook_data_cache_${userId}`,
    expiry: `myfxbook_cache_expiry_${userId}`,
    midnightReset: `myfxbook_midnight_reset_${userId}`
  }
}

/**
 * Verifica se o cache está válido
 * @param {string} userId - ID do usuário atual
 * @returns {boolean}
 */
export function isCacheValid(userId) {
  try {
    if (!userId) return false
    
    const keys = getCacheKeys(userId)
    const expiry = localStorage.getItem(keys.expiry)
    if (!expiry) return false
    
    const expiryTime = parseInt(expiry, 10)
    const now = Date.now()
    
    // Cache válido se não expirou
    return now < expiryTime
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao verificar cache:', error)
    return false
  }
}

/**
 * Verifica se precisa renovar à meia-noite
 * @param {string} userId - ID do usuário atual
 * @returns {boolean}
 */
function needsMidnightReset(userId) {
  try {
    if (!userId) return true
    
    const keys = getCacheKeys(userId)
    const lastReset = localStorage.getItem(keys.midnightReset)
    if (!lastReset) return true
    
    const lastResetDate = new Date(parseInt(lastReset, 10))
    const now = new Date()
    
    // Se já passou da meia-noite desde a última renovação
    if (now.getDate() !== lastResetDate.getDate() || 
        now.getMonth() !== lastResetDate.getMonth() ||
        now.getFullYear() !== lastResetDate.getFullYear()) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao verificar reset meia-noite:', error)
    return true
  }
}

/**
 * Obtém dados do cache
 * @param {string} userId - ID do usuário atual
 * @returns {Object|null}
 */
export function getCachedData(userId) {
  try {
    if (!userId) {
      console.warn('[MyFXBook Cache] userId não fornecido, não é possível obter cache')
      return null
    }
    
    if (!isCacheValid(userId)) {
      console.log('[MyFXBook Cache] Cache expirado ou inválido')
      return null
    }
    
    // Verificar se precisa resetar à meia-noite
    if (needsMidnightReset(userId)) {
      console.log('[MyFXBook Cache] Reset de meia-noite necessário, invalidando cache')
      clearCache(userId)
      return null
    }
    
    const keys = getCacheKeys(userId)
    const cached = localStorage.getItem(keys.cache)
    if (!cached) return null
    
    const data = JSON.parse(cached)
    console.log('[MyFXBook Cache] Dados recuperados do cache para usuário:', userId)
    return data
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao obter cache:', error)
    return null
  }
}

/**
 * Salva dados no cache
 * @param {Object} data - Dados para salvar
 * @param {string} userId - ID do usuário atual
 * @param {number} expiryHours - Horas até expirar (padrão: 24 horas)
 */
export function setCachedData(data, userId, expiryHours = 24) {
  try {
    if (!userId) {
      console.warn('[MyFXBook Cache] userId não fornecido, não é possível salvar cache')
      return
    }
    
    const now = Date.now()
    const expiryTime = now + (expiryHours * 60 * 60 * 1000)
    const keys = getCacheKeys(userId)
    
    localStorage.setItem(keys.cache, JSON.stringify(data))
    localStorage.setItem(keys.expiry, expiryTime.toString())
    localStorage.setItem(keys.midnightReset, now.toString())
    
    console.log('[MyFXBook Cache] Dados salvos no cache para usuário:', userId, 'expira em', expiryHours, 'horas')
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao salvar cache:', error)
    // Se o localStorage estiver cheio, limpar cache antigo
    try {
      if (userId) {
        clearCache(userId)
        const keys = getCacheKeys(userId)
        localStorage.setItem(keys.cache, JSON.stringify(data))
        localStorage.setItem(keys.expiry, (Date.now() + (expiryHours * 60 * 60 * 1000)).toString())
      }
    } catch (e) {
      console.error('[MyFXBook Cache] Erro ao limpar e salvar cache:', e)
    }
  }
}

/**
 * Limpa o cache de um usuário específico ou de todos os usuários
 * @param {string|null} userId - ID do usuário (se null, limpa todos os caches)
 */
export function clearCache(userId = null) {
  try {
    if (userId) {
      // Limpar cache de um usuário específico
      const keys = getCacheKeys(userId)
      localStorage.removeItem(keys.cache)
      localStorage.removeItem(keys.expiry)
      localStorage.removeItem(keys.midnightReset)
      console.log('[MyFXBook Cache] Cache limpo para usuário:', userId)
    } else {
      // Limpar todos os caches (útil para logout ou limpeza geral)
      // Buscar todas as chaves do localStorage que começam com 'myfxbook_'
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('myfxbook_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log('[MyFXBook Cache] Todos os caches limpos')
    }
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao limpar cache:', error)
  }
}

/**
 * Configura renovação automática à meia-noite para um usuário específico
 * @param {string} userId - ID do usuário atual
 */
export function setupMidnightReset(userId) {
  try {
    if (!userId) {
      console.warn('[MyFXBook Cache] userId não fornecido para setup de reset')
      return
    }
    
    // Calcular tempo até próxima meia-noite
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0) // Próxima meia-noite
    
    const msUntilMidnight = midnight.getTime() - now.getTime()
    
    // Configurar timeout para renovar à meia-noite
    setTimeout(() => {
      console.log('[MyFXBook Cache] Renovando cache à meia-noite para usuário:', userId)
      clearCache(userId)
      
      // Configurar para próxima meia-noite (se ainda houver usuário logado)
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
      if (currentUser && currentUser.id === userId) {
        setupMidnightReset(userId)
      }
    }, msUntilMidnight)
    
    console.log('[MyFXBook Cache] Reset automático configurado para', new Date(midnight).toLocaleString(), 'usuário:', userId)
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao configurar reset meia-noite:', error)
  }
}

/**
 * Força renovação do cache (útil para botão de refresh)
 * @param {string} userId - ID do usuário atual
 */
export function forceRefresh(userId) {
  if (userId) {
    clearCache(userId)
    console.log('[MyFXBook Cache] Cache forçado a renovar para usuário:', userId)
  } else {
    clearCache()
    console.log('[MyFXBook Cache] Todos os caches forçados a renovar')
  }
}

