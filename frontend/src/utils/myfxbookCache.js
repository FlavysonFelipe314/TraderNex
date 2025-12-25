/**
 * Sistema de cache para dados do MyFXBook
 * Armazena dados no localStorage e renova automaticamente à meia-noite
 */

const CACHE_KEY = 'myfxbook_data_cache'
const CACHE_EXPIRY_KEY = 'myfxbook_cache_expiry'
const MIDNIGHT_RESET_KEY = 'myfxbook_midnight_reset'

/**
 * Verifica se o cache está válido
 * @returns {boolean}
 */
export function isCacheValid() {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY)
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
 * @returns {boolean}
 */
function needsMidnightReset() {
  try {
    const lastReset = localStorage.getItem(MIDNIGHT_RESET_KEY)
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
 * @returns {Object|null}
 */
export function getCachedData() {
  try {
    if (!isCacheValid()) {
      console.log('[MyFXBook Cache] Cache expirado ou inválido')
      return null
    }
    
    // Verificar se precisa resetar à meia-noite
    if (needsMidnightReset()) {
      console.log('[MyFXBook Cache] Reset de meia-noite necessário, invalidando cache')
      clearCache()
      return null
    }
    
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const data = JSON.parse(cached)
    console.log('[MyFXBook Cache] Dados recuperados do cache')
    return data
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao obter cache:', error)
    return null
  }
}

/**
 * Salva dados no cache
 * @param {Object} data - Dados para salvar
 * @param {number} expiryHours - Horas até expirar (padrão: 24 horas)
 */
export function setCachedData(data, expiryHours = 24) {
  try {
    const now = Date.now()
    const expiryTime = now + (expiryHours * 60 * 60 * 1000)
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString())
    localStorage.setItem(MIDNIGHT_RESET_KEY, now.toString())
    
    console.log('[MyFXBook Cache] Dados salvos no cache, expira em', expiryHours, 'horas')
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao salvar cache:', error)
    // Se o localStorage estiver cheio, limpar cache antigo
    try {
      clearCache()
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + (expiryHours * 60 * 60 * 1000)).toString())
    } catch (e) {
      console.error('[MyFXBook Cache] Erro ao limpar e salvar cache:', e)
    }
  }
}

/**
 * Limpa o cache
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    localStorage.removeItem(MIDNIGHT_RESET_KEY)
    console.log('[MyFXBook Cache] Cache limpo')
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao limpar cache:', error)
  }
}

/**
 * Configura renovação automática à meia-noite
 */
export function setupMidnightReset() {
  try {
    // Calcular tempo até próxima meia-noite
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0) // Próxima meia-noite
    
    const msUntilMidnight = midnight.getTime() - now.getTime()
    
    // Configurar timeout para renovar à meia-noite
    setTimeout(() => {
      console.log('[MyFXBook Cache] Renovando cache à meia-noite...')
      clearCache()
      
      // Configurar para próxima meia-noite
      setupMidnightReset()
    }, msUntilMidnight)
    
    console.log('[MyFXBook Cache] Reset automático configurado para', new Date(midnight).toLocaleString())
  } catch (error) {
    console.error('[MyFXBook Cache] Erro ao configurar reset meia-noite:', error)
  }
}

/**
 * Força renovação do cache (útil para botão de refresh)
 */
export function forceRefresh() {
  clearCache()
  console.log('[MyFXBook Cache] Cache forçado a renovar')
}

