/**
 * Formata número para formato brasileiro (1.234,56)
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} Valor formatado
 */
export const formatNumberBR = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '0,00'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0,00'
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formata valor monetário para formato brasileiro (R$ 1.234,56)
 * @param {number|string} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: 'USD')
 * @returns {string} Valor formatado
 */
export const formatCurrencyBR = (value, currency = 'USD') => {
  if (value === null || value === undefined || value === '') return '$ 0,00'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '$ 0,00'
  
  const symbol = currency === 'USD' ? '$' : currency === 'BRL' ? 'R$' : currency
  
  return `${symbol} ${numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Formata porcentagem para formato brasileiro (12,34%)
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} Valor formatado
 */
export const formatPercentBR = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '0,00%'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0,00%'
  
  const formatted = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  
  return `${numValue >= 0 ? '+' : ''}${formatted}%`
}
