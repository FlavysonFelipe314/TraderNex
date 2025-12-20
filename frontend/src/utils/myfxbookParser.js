/**
 * Converte data do formato Myfxbook (DD/MM/YYYY ou DD/MM/YYYY HH:mm) para Date
 * @param {string} dateStr - Data no formato "DD/MM/YYYY" ou "DD/MM/YYYY HH:mm"
 * @returns {Date} Objeto Date
 */
export const parseMyfxbookDate = (dateStr) => {
  if (!dateStr) return null
  
  // Formato: "02/01/2010" ou "03/01/2010 14:13"
  const parts = dateStr.trim().split(' ')
  const datePart = parts[0] // "02/01/2010"
  const timePart = parts[1] || '00:00' // "14:13" ou "00:00"
  
  const [day, month, year] = datePart.split('/').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  return new Date(year, month - 1, day, hours || 0, minutes || 0)
}

/**
 * Processa dados diários do Myfxbook (vem como array de arrays)
 * @param {Array} dataDaily - Array de arrays com dados diários
 * @returns {Array} Array achatado com dados diários processados
 */
export const processDataDaily = (dataDaily) => {
  if (!dataDaily || !Array.isArray(dataDaily)) return []
  
  // dataDaily vem como: [[{date: "02/01/2010", balance: ..., ...}]]
  // Precisamos achatar e processar
  const flattened = []
  
  dataDaily.forEach(dayArray => {
    if (Array.isArray(dayArray)) {
      dayArray.forEach(day => {
        if (day && day.date) {
          flattened.push({
            date: parseMyfxbookDate(day.date),
            dateStr: day.date,
            balance: parseFloat(day.balance || 0),
            pips: parseFloat(day.pips || 0),
            lots: parseFloat(day.lots || 0),
            floatingPL: parseFloat(day.floatingPL || 0),
            profit: parseFloat(day.profit || 0),
            growthEquity: parseFloat(day.growthEquity || 0),
            floatingPips: parseFloat(day.floatingPips || 0)
          })
        }
      })
    } else if (dayArray && dayArray.date) {
      // Se já vier como objeto único
      flattened.push({
        date: parseMyfxbookDate(dayArray.date),
        dateStr: dayArray.date,
        balance: parseFloat(dayArray.balance || 0),
        pips: parseFloat(dayArray.pips || 0),
        lots: parseFloat(dayArray.lots || 0),
        floatingPL: parseFloat(dayArray.floatingPL || 0),
        profit: parseFloat(dayArray.profit || 0),
        growthEquity: parseFloat(dayArray.growthEquity || 0),
        floatingPips: parseFloat(dayArray.floatingPips || 0)
      })
    }
  })
  
  // Ordenar por data
  return flattened.sort((a, b) => a.date - b.date)
}

/**
 * Processa histórico de trades do Myfxbook
 * @param {Array} history - Array de trades
 * @returns {Array} Array de trades processados
 */
export const processHistory = (history) => {
  if (!history || !Array.isArray(history)) return []
  
  return history.map(trade => ({
    ...trade,
    openTimeDate: parseMyfxbookDate(trade.openTime),
    closeTimeDate: parseMyfxbookDate(trade.closeTime),
    profit: parseFloat(trade.profit || 0),
    pips: parseFloat(trade.pips || 0),
    openPrice: parseFloat(trade.openPrice || 0),
    closePrice: parseFloat(trade.closePrice || 0),
    lots: parseFloat(trade.sizing?.value || trade.lots || 0),
    symbol: trade.symbol || '',
    side: trade.action?.toLowerCase().includes('buy') ? 'buy' : 'sell'
  }))
}

/**
 * Processa ganho diário do Myfxbook (vem como array de arrays)
 * @param {Array} dailyGain - Array de arrays com ganho diário
 * @returns {Array} Array achatado com ganho diário processado
 */
export const processDailyGain = (dailyGain) => {
  if (!dailyGain || !Array.isArray(dailyGain)) return []
  
  const flattened = []
  
  dailyGain.forEach(dayArray => {
    if (Array.isArray(dayArray)) {
      dayArray.forEach(day => {
        if (day && day.date) {
          flattened.push({
            date: parseMyfxbookDate(day.date),
            dateStr: day.date,
            value: parseFloat(day.value || 0),
            profit: parseFloat(day.profit || 0)
          })
        }
      })
    } else if (dayArray && dayArray.date) {
      flattened.push({
        date: parseMyfxbookDate(dayArray.date),
        dateStr: dayArray.date,
        value: parseFloat(dayArray.value || 0),
        profit: parseFloat(dayArray.profit || 0)
      })
    }
  })
  
  return flattened.sort((a, b) => a.date - b.date)
}

/**
 * Cria histórico mensal real baseado nos dados do Myfxbook
 * @param {Object} myfxbookData - Dados completos do Myfxbook
 * @returns {Array} Array com histórico mensal processado
 */
export const createMonthlyHistory = (myfxbookData) => {
  if (!myfxbookData) return []
  
  const monthlyMap = new Map()
  
  // Processar dados diários para obter balance e drawdown por mês
  const processedDataDaily = processDataDaily(myfxbookData.dataDaily || [])
  const processedHistory = processHistory(myfxbookData.history || [])
  const processedDailyGain = processDailyGain(myfxbookData.dailyGain || [])
  
  // Agrupar trades por mês usando closeTime
  processedHistory.forEach(trade => {
    if (!trade.closeTimeDate) return
    
    const date = trade.closeTimeDate
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        period: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        periodKey: monthKey,
        trades: 0,
        profit: 0,
        pips: 0,
        lots: 0,
        balance: 0,
        maxDrawdown: 0,
        minBalance: Infinity,
        maxBalance: -Infinity
      })
    }
    
    const monthData = monthlyMap.get(monthKey)
    monthData.trades += 1
    monthData.profit += trade.profit || 0
    monthData.pips += trade.pips || 0
    monthData.lots += trade.lots || 0
  })
  
  // Processar dados diários para calcular drawdown e balance por mês
  processedDataDaily.forEach(day => {
    if (!day.date) return
    
    const date = day.date
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (monthlyMap.has(monthKey)) {
      const monthData = monthlyMap.get(monthKey)
      
      // Atualizar balance mínimo e máximo
      if (day.balance < monthData.minBalance) {
        monthData.minBalance = day.balance
      }
      if (day.balance > monthData.maxBalance) {
        monthData.maxBalance = day.balance
      }
      
      // Calcular drawdown baseado em growthEquity (negativo indica drawdown)
      if (day.growthEquity < 0) {
        const drawdown = Math.abs(day.growthEquity)
        if (drawdown > monthData.maxDrawdown) {
          monthData.maxDrawdown = drawdown
        }
      }
      
      // Atualizar balance final do mês
      monthData.balance = day.balance
    }
  })
  
  // Processar dailyGain para drawdown adicional
  processedDailyGain.forEach(day => {
    if (!day.date) return
    
    const date = day.date
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (monthlyMap.has(monthKey)) {
      const monthData = monthlyMap.get(monthKey)
      // Se não tiver drawdown dos dataDaily, usar do dailyGain
      if (monthData.maxDrawdown === 0 && day.value < 0) {
        monthData.maxDrawdown = Math.abs(day.value)
      }
    }
  })
  
  // Converter para array e calcular retorno
  const history = Array.from(monthlyMap.values())
    .map(month => {
      // Calcular drawdown percentual se tiver balance
      let drawdownPercent = month.maxDrawdown
      if (month.maxBalance > 0 && month.minBalance < month.maxBalance) {
        const drawdownValue = month.maxBalance - month.minBalance
        drawdownPercent = (drawdownValue / month.maxBalance) * 100
      }
      
      return {
        ...month,
        drawdown: drawdownPercent,
        minBalance: month.minBalance === Infinity ? 0 : month.minBalance,
        maxBalance: month.maxBalance === -Infinity ? 0 : month.maxBalance
      }
    })
    .sort((a, b) => {
      // Ordenar por período (mais recente primeiro)
      const [yearA, monthA] = a.periodKey.split('-').map(Number)
      const [yearB, monthB] = b.periodKey.split('-').map(Number)
      
      if (yearB !== yearA) return yearB - yearA
      return monthB - monthA
    })
    .slice(0, 12) // Últimos 12 meses
  
  return history
}

