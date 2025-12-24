import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getPerformanceStats, getMyfxbookData, getDashboardData } from '../services/dashboardService'
import { formatCurrencyBR, formatPercentBR, formatNumberBR } from '../utils/format'

function RelatoriosPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('este-mes')
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [performanceData, setPerformanceData] = useState(null)
  const [myfxbookData, setMyfxbookData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Refs para controlar requisições e debounce
  const abortControllerRef = useRef(null)
  const loadTimeoutRef = useRef(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Calcular datas baseadas no período selecionado
  const getDateRange = (period) => {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    let startDate = ''

    switch (period) {
      case 'hoje':
        startDate = endDate
        break
      case '7-dias':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        startDate = sevenDaysAgo.toISOString().split('T')[0]
        break
      case 'este-mes':
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate = firstDayOfMonth.toISOString().split('T')[0]
        break
      case 'este-ano':
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
        startDate = firstDayOfYear.toISOString().split('T')[0]
        break
      case 'custom':
        return { startDate: customDates.startDate, endDate: customDates.endDate }
      default:
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
    }

    return { startDate, endDate }
  }

  // Função para carregar dados com proteção contra múltiplas requisições
  const loadPerformanceData = useCallback(async (period, startDate, endDate) => {
    // Se já está carregando, ignorar nova requisição
    if (isLoadingRef.current) {
      console.log('[Relatórios] Ignorando requisição, já está carregando...')
      return
    }
    
    isLoadingRef.current = true
    setLoading(true)
    
    try {
      const dateRange = getDateRange(period)
      console.log('[Relatórios] Carregando dados para período:', period, 'Datas:', dateRange)
      
      // Carregar dados do MyFXBook com filtros de data
      const myfxbookPromise = getMyfxbookData(dateRange.startDate, dateRange.endDate)
      
      // Carregar dados do dashboard para obter informações do plano
      const dashboardPromise = getDashboardData()
      
      // Carregar dados de performance como fallback
      const periodMap = {
        'hoje': 'day',
        '7-dias': 'week',
        'este-mes': 'month',
        'este-ano': 'year',
        'custom': 'month'
      }
      const backendPeriod = periodMap[period] || 'month'
      const performancePromise = getPerformanceStats(backendPeriod)
      
      // Aguardar todas as requisições com tratamento de erros
      const [myfxbookResult, dashboardResult, performanceResult] = await Promise.allSettled([
        myfxbookPromise,
        dashboardPromise,
        performancePromise
      ])
      
      // Processar resultado MyFXBook
      if (myfxbookResult.status === 'fulfilled') {
        const result = myfxbookResult.value
        console.log('[Relatórios] Resultado MyFXBook:', result)
        
        if (result.success && result.data?.connected) {
          setMyfxbookData(result.data)
        } else {
          // Não limpar dados se foi erro de rate limit (429)
          if (result.error?.status !== 429 && result.error?.response?.status !== 429) {
            setMyfxbookData(null)
          }
        }
      } else {
        // Erro na requisição MyFXBook
        const error = myfxbookResult.reason
        if (error.response?.status === 429) {
          console.warn('[Relatórios] Rate limit MyFXBook, mantendo dados anteriores')
          // Não limpar dados em caso de rate limit
        } else {
          console.error('[Relatórios] Erro ao carregar MyFXBook:', error)
          // Só limpar se não for erro de autenticação (para não deslogar)
          if (error.response?.status !== 401) {
            setMyfxbookData(null)
          }
        }
      }

      // Processar resultado Dashboard
      if (dashboardResult.status === 'fulfilled') {
        const result = dashboardResult.value
        if (result.success) {
          setDashboardData(result.data)
        }
      } else {
        const error = dashboardResult.reason
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('[Relatórios] Erro ao carregar dashboard:', error)
        }
      }

      // Processar resultado Performance
      if (performanceResult.status === 'fulfilled') {
        const result = performanceResult.value
        if (result.success) {
          setPerformanceData(result.data)
        }
      } else {
        const error = performanceResult.reason
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('[Relatórios] Erro ao carregar performance:', error)
        }
      }
    } catch (error) {
      // Tratamento de erro geral
      if (error.response?.status === 429) {
        console.warn('[Relatórios] Rate limit atingido, mantendo dados anteriores')
        return
      }
      if (error.response?.status === 401) {
        // Erro de autenticação será tratado pelo interceptor do axios
        console.warn('[Relatórios] Erro de autenticação')
        return
      }
      console.error('Erro ao carregar dados de performance:', error)
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }, [])

  // Carregar dados do dashboard na montagem inicial
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await getDashboardData()
        if (result.success) {
          setDashboardData(result.data)
        }
      } catch (error) {
        console.error('[Relatórios] Erro ao carregar dashboard:', error)
      }
    }
    loadDashboard()
  }, [])

  // Carregar dados de performance e MyFXBook com debounce
  useEffect(() => {
    // Limpar timeout anterior
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    
    // Debounce de 300ms para evitar múltiplas requisições rápidas
    loadTimeoutRef.current = setTimeout(() => {
      loadPerformanceData(selectedPeriod, customDates.startDate, customDates.endDate)
    }, 300)
    
    // Cleanup: cancelar timeout ao desmontar ou mudar dependências
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [selectedPeriod, customDates.startDate, customDates.endDate, loadPerformanceData])

  // Função auxiliar para converter data do formato MyFXBook (MM/DD/YYYY) para Date
  // DEVE estar declarada antes de qualquer useMemo que a utilize
  const parseMyFXBookDate = (dateStr) => {
    if (!dateStr) return new Date(NaN)
    if (dateStr instanceof Date) return dateStr

    // Formato MM/DD/YYYY (formato da API MyFXBook)
    const mmddyyyy = String(dateStr).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (mmddyyyy) {
      return new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]))
    }

    // Tentar parse padrão (ISO, timestamp, etc)
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) return parsed

    return new Date(NaN)
  }

  // Calcular KPIs baseados em dados do MyFXBook
  const kpis = useMemo(() => {
    if (!myfxbookData?.account) {
      return {
        totalReturn: 0,
        netProfit: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        gain: 0,
        openTrades: 0,
        openOrders: 0,
        totalTrades: 0
      }
    }

    const account = myfxbookData.account
    
    // Calcular total de trades do período filtrado
    // IMPORTANTE: A API get-history retorna apenas as últimas 50 trades
    // O total real de trades (ex: 7970) não está disponível via API diretamente
    // Por enquanto, contamos apenas os trades disponíveis no histórico filtrado por data
    let totalTrades = 0
    
    if (myfxbookData.history && Array.isArray(myfxbookData.history)) {
      // Se temos período definido, filtrar trades por data do período
      if (myfxbookData.period?.startDate && myfxbookData.period?.endDate) {
        const startDate = new Date(myfxbookData.period.startDate)
        const endDate = new Date(myfxbookData.period.endDate)
        endDate.setHours(23, 59, 59, 999) // Incluir o dia inteiro
        
        // parseMyFXBookDate está definida antes deste useMemo, podemos usar
        const filteredHistory = myfxbookData.history.filter(trade => {
          // Usar closeTime preferencialmente, depois time, date ou openTime
          const dateStr = trade.closeTime || trade.time || trade.date || trade.openTime
          const tradeDate = parseMyFXBookDate(dateStr)
          if (isNaN(tradeDate.getTime())) return false
          return tradeDate >= startDate && tradeDate <= endDate
        })
        
        totalTrades = filteredHistory.length
      } else {
        // Se não há período definido, usar todos os trades disponíveis (limitado a 50 pela API)
        totalTrades = myfxbookData.history.length
      }
    }
    
    // NOTA: A API MyFXBook get-history retorna apenas as últimas 50 trades
    // Para obter o total completo (ex: 7970), seria necessário usar outra fonte de dados
    // Este valor representa apenas os trades do período filtrado disponíveis via API
    
    // Calcular lucro líquido: lucro bruto - porcentagem do plano
    const grossProfit = parseFloat(account.profit || 0)
    const profitFeePercentage = dashboardData?.profile?.profit_fee_percentage || 0
    const netProfit = grossProfit > 0 
      ? grossProfit * (1 - profitFeePercentage / 100)
      : grossProfit
    
    return {
      totalReturn: parseFloat(account.absGain || account.gain || 0),
      netProfit: netProfit, // Lucro líquido (já descontado a taxa do plano)
      grossProfit: grossProfit, // Lucro bruto (para referência)
      profitFactor: parseFloat(account.profitFactor || 0),
      maxDrawdown: Math.abs(parseFloat(account.drawdown || 0)),
      gain: parseFloat(myfxbookData.gain || account.gain || 0),
      openTrades: myfxbookData.openTrades?.length || 0,
      openOrders: myfxbookData.openOrders?.length || 0,
      totalTrades: totalTrades
    }
  }, [myfxbookData, dashboardData, parseMyFXBookDate])

  // Processar histórico mensal dos dados do MyFXBook
  // Usando dataDaily para obter números reais e validados do MyFXBook
  const monthlyHistory = useMemo(() => {
    // Prioridade 1: Usar dataDaily (dados reais validados do MyFXBook)
    let dataDailyArray = myfxbookData?.dataDaily || []
    if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
      dataDailyArray = dataDailyArray.flat()
    }

    const monthlyMap = new Map()

    if (dataDailyArray && dataDailyArray.length > 0) {
      // Agrupar dados diários por mês usando profit real do MyFXBook
      dataDailyArray.forEach(day => {
        const dateStr = day.date || day.time || day.openTime || day.closeTime
        const date = parseMyFXBookDate(dateStr)
        
        if (isNaN(date.getTime())) return // Pular datas inválidas
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            period: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            monthKey: monthKey,
            trades: 0, // Será calculado do history se disponível
            profit: 0, // Soma do profit diário (valor real do MyFXBook)
            drawdown: 0,
            maxBalance: null, // Balance máximo do mês (para calcular drawdown)
            minBalance: null, // Balance mínimo do mês (para calcular drawdown)
            return: 0,
            startBalance: null, // Balance inicial do mês
            endBalance: null, // Balance final do mês
            days: 0 // Número de dias com dados
          })
        }
        
        const monthData = monthlyMap.get(monthKey)
        const profit = parseFloat(day.profit || 0)
        const balance = parseFloat(day.balance || day.equity || 0)
        const equity = parseFloat(day.equity || day.balance || 0)
        const valueToUse = equity || balance
        
        monthData.profit += profit // Soma o profit diário real
        monthData.days += 1
        
        // Armazenar balance inicial e final do mês
        if (monthData.startBalance === null) {
          monthData.startBalance = valueToUse
        }
        if (monthData.endBalance === null || valueToUse > monthData.endBalance) {
          monthData.endBalance = valueToUse
        }
        
        // Calcular drawdown: trackear máximo e mínimo para calcular drawdown percentual
        if (monthData.maxBalance === null || valueToUse > monthData.maxBalance) {
          monthData.maxBalance = valueToUse
          monthData.minBalance = valueToUse // Reset min quando há novo máximo
        }
        if (monthData.minBalance === null || valueToUse < monthData.minBalance) {
          monthData.minBalance = valueToUse
        }
        
        // Calcular drawdown percentual baseado no máximo e mínimo do mês
        if (monthData.maxBalance !== null && monthData.maxBalance > 0 && monthData.minBalance !== null) {
          const currentDrawdown = ((monthData.maxBalance - monthData.minBalance) / monthData.maxBalance) * 100
          if (currentDrawdown > monthData.drawdown) {
            monthData.drawdown = currentDrawdown
          }
        }
        
        // Se o drawdown vier direto dos dados, usar se for maior
        if (day.drawdown !== undefined && day.drawdown !== null) {
          const dayDrawdown = Math.abs(parseFloat(day.drawdown))
          if (dayDrawdown > monthData.drawdown) {
            monthData.drawdown = dayDrawdown
          }
        }
      })
    }

    // Calcular número de trades por mês (usando history se disponível)
    if (myfxbookData?.history && myfxbookData.history.length > 0) {
      myfxbookData.history.forEach(trade => {
        const date = parseMyFXBookDate(trade.closeTime || trade.time || trade.date)
        if (isNaN(date.getTime())) return
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyMap.has(monthKey)) {
          monthlyMap.get(monthKey).trades += 1
        }
      })
    }

    // Calcular drawdown máximo por mês (usando dailyGain se disponível)
    if (myfxbookData?.dailyGain && myfxbookData.dailyGain.length > 0) {
      myfxbookData.dailyGain.forEach(day => {
        const date = parseMyFXBookDate(day.date || day.time)
        if (isNaN(date.getTime())) return
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)
          const drawdown = Math.abs(parseFloat(day.drawdown || 0))
          if (drawdown > monthData.drawdown) {
            monthData.drawdown = drawdown
          }
        }
      })
    }

    // Se não temos dataDaily, tentar usar apenas dailyGain como fallback
    if (monthlyMap.size === 0 && myfxbookData?.dailyGain && myfxbookData.dailyGain.length > 0) {
      myfxbookData.dailyGain.forEach(day => {
        const date = parseMyFXBookDate(day.date || day.time)
        if (isNaN(date.getTime())) return
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            period: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            monthKey: monthKey,
            trades: 0,
            profit: 0,
            drawdown: 0,
            return: 0,
            startBalance: null,
            endBalance: null,
            days: 0
          })
        }
        
        const monthData = monthlyMap.get(monthKey)
        const profit = parseFloat(day.profit || 0)
        monthData.profit += profit
        monthData.days += 1
        
        const drawdown = Math.abs(parseFloat(day.drawdown || 0))
        if (drawdown > monthData.drawdown) {
          monthData.drawdown = drawdown
        }
      })
    }

    // Converter para array e calcular retorno percentual
    const history = Array.from(monthlyMap.values())
      .map(month => {
        // Calcular retorno percentual baseado no balance inicial e final
        let returnPercent = 0
        if (month.startBalance && month.startBalance > 0) {
          const balanceChange = (month.endBalance || month.startBalance) - month.startBalance
          returnPercent = (balanceChange / month.startBalance) * 100
        } else if (kpis.netProfit && kpis.netProfit !== 0) {
          // Fallback: usar profit total da conta como referência
          returnPercent = (month.profit / Math.abs(kpis.netProfit)) * 100
        }

        // Se o drawdown mensal for zero mas temos drawdown geral da conta e o mês tem dados, usar o drawdown geral
        // Isso corrige casos onde os dados diários não têm drawdown específico mas a conta tem
        let finalDrawdown = month.drawdown
        if (finalDrawdown === 0 && kpis.maxDrawdown > 0 && month.days > 0) {
          // Para meses com dados mas sem drawdown específico, usar o drawdown geral da conta
          // Especialmente útil para o mês atual ou meses recentes
          finalDrawdown = kpis.maxDrawdown
        }

        return {
          ...month,
          profitFormatted: formatCurrencyBR(month.profit),
          drawdownFormatted: finalDrawdown > 0 ? `${formatNumberBR(finalDrawdown)}%` : '0,00%',
          returnFormatted: formatPercentBR(returnPercent, 1),
          isPositive: month.profit >= 0,
          isWarning: finalDrawdown > 3
        }
      })
      .sort((a, b) => {
        // Ordenar por monthKey (mais recente primeiro)
        return b.monthKey.localeCompare(a.monthKey)
      })
      .slice(0, 12) // Últimos 12 meses

    console.log('[MonthlyHistory] Histórico mensal calculado:', {
      totalMonths: history.length,
      months: history.map(m => ({ period: m.period, profit: m.profit, trades: m.trades }))
    })

    return history
  }, [myfxbookData, kpis.netProfit])

  // Calcular estatísticas de profit
  const profitStats = useMemo(() => {
    // Verificar se dataDaily existe e tem dados
    let dataDailyArray = myfxbookData?.dataDaily || []
    
    // A API pode retornar array aninhado, então vamos desaninhar se necessário
    if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
      dataDailyArray = dataDailyArray.flat()
    }
    
    if (!dataDailyArray || dataDailyArray.length === 0) {
      console.log('[ProfitStats] Nenhum dado dataDaily disponível')
      return {
        totalProfit: 0,
        averageDailyProfit: 0,
        bestDay: null,
        worstDay: null,
        profitDays: 0,
        lossDays: 0,
        profitByDay: []
      }
    }

    console.log('[ProfitStats] Processando dataDaily:', dataDailyArray.length, 'registros')
    console.log('[ProfitStats] Primeiro item:', dataDailyArray[0])

    const profits = dataDailyArray
      .map(item => {
        const dateStr = item.date || item.time || item.openTime || item.closeTime
        const parsedDate = parseMyFXBookDate(dateStr)
        const profit = parseFloat(item.profit || 0)
        
        return {
          date: parsedDate,
          profit: profit,
          balance: parseFloat(item.balance || 0),
          equity: parseFloat(item.equity || 0),
          rawData: item // Manter dados originais para debug
        }
      })
      .filter(item => !isNaN(item.date.getTime())) // Filtrar datas inválidas

    const totalProfit = profits.reduce((sum, item) => sum + item.profit, 0)
    const averageDailyProfit = totalProfit / profits.length
    const bestDay = profits.reduce((best, current) => current.profit > (best?.profit || -Infinity) ? current : best, null)
    const worstDay = profits.reduce((worst, current) => current.profit < (worst?.profit || Infinity) ? current : worst, null)
    const profitDays = profits.filter(p => p.profit > 0).length
    const lossDays = profits.filter(p => p.profit < 0).length

    return {
      totalProfit,
      averageDailyProfit,
      bestDay,
      worstDay,
      profitDays,
      lossDays,
      profitByDay: profits.sort((a, b) => b.date - a.date) // Mais recente primeiro
    }
  }, [myfxbookData])

  // Dados do gráfico
  const chartData = useMemo(() => {
    // Desaninhar dataDaily se necessário
    let dataDailyArray = myfxbookData?.dataDaily || []
    if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
      dataDailyArray = dataDailyArray.flat()
    }
    
    // Prioridade 1: Dados do MyFXBook (dataDaily)
    if (dataDailyArray && dataDailyArray.length > 0) {
      return dataDailyArray.map(item => ({
        date: parseMyFXBookDate(item.date || item.time),
        equity: parseFloat(item.equity || 0),
        balance: parseFloat(item.balance || 0),
        profit: parseFloat(item.profit || 0)
      })).filter(item => !isNaN(item.date.getTime())).sort((a, b) => a.date - b.date)
    }
    
    // Prioridade 2: Dados do MyFXBook (dailyGain)
    if (myfxbookData?.dailyGain && myfxbookData.dailyGain.length > 0) {
      let cumulative = 0
      // Desaninhar se necessário
      let dailyGainArray = myfxbookData.dailyGain
      if (dailyGainArray.length > 0 && Array.isArray(dailyGainArray[0])) {
        dailyGainArray = dailyGainArray.flat()
      }
      return dailyGainArray.map(item => {
        cumulative += parseFloat(item.gain || item.profit || 0)
        return {
          date: parseMyFXBookDate(item.date || item.time),
          equity: cumulative,
          balance: cumulative
        }
      }).sort((a, b) => a.date - b.date)
    }
    
    // Prioridade 3: Dados de performance do backend (fallback)
    if (performanceData && Array.isArray(performanceData) && performanceData.length > 0) {
      let cumulativeBalance = 0
      let cumulativeEquity = 0
      
      return performanceData.map(item => {
        const netProfit = parseFloat(item.net_profit || item.value || 0)
        cumulativeBalance += netProfit
        cumulativeEquity += netProfit
        
        return {
          date: new Date(item.report_date || item.date),
          equity: cumulativeEquity,
          balance: cumulativeBalance
        }
      }).filter(item => !isNaN(item.date.getTime())).sort((a, b) => a.date - b.date)
    }
    
    return []
  }, [myfxbookData, performanceData])

  // Função para escapar valores CSV (manter compatibilidade com Excel)
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    // Se contém vírgula, aspas ou quebra de linha, envolver em aspas e duplicar aspas internas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Função para formatar número para CSV (sem formatação de moeda)
  const formatNumberCSV = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0'
    return String(parseFloat(value).toFixed(2)).replace('.', ',')
  }

  // Exportar CSV completo com todos os dados do MyFXBook
  const handleExportCSV = () => {
    if (!myfxbookData) {
      alert('Nenhum dado disponível para exportar')
      return
    }

    // Usar BOM UTF-8 para garantir encoding correto no Excel
    const BOM = '\uFEFF'
    let csvContent = BOM
    
    const account = myfxbookData.account || {}
    const dateNow = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // ===== SEÇÃO 1: INFORMAÇÕES GERAIS DA CONTA =====
    csvContent += 'RELATÓRIO DE PERFORMANCE - DADOS DO MT4\n'
    csvContent += `Data de Geração,${dateNow}\n`
    csvContent += `Nome da Conta,${escapeCSV(account.name || 'N/A')}\n`
    csvContent += `ID da Conta,${escapeCSV(account.accountId || 'N/A')}\n`
    csvContent += `Moeda,${escapeCSV(account.currency || 'USD')}\n`
    csvContent += '\n'
    
    // ===== SEÇÃO 2: MÉTRICAS PRINCIPAIS =====
    csvContent += 'MÉTRICAS PRINCIPAIS\n'
    csvContent += 'Métrica,Valor\n'
    csvContent += `Ganho Total (%),${formatNumberCSV(account.absGain || account.gain || 0)}\n`
    csvContent += `Lucro Líquido (${account.currency || 'USD'}),${formatNumberCSV(account.profit || 0)}\n`
    csvContent += `Drawdown Máximo (%),${formatNumberCSV(Math.abs(account.drawdown || 0))}\n`
    csvContent += `Equity (${account.currency || 'USD'}),${formatNumberCSV(account.equity || 0)}\n`
    csvContent += `Balance (${account.currency || 'USD'}),${formatNumberCSV(account.balance || 0)}\n`
    csvContent += `Profit Factor,${formatNumberCSV(account.profitFactor || 0)}\n`
    csvContent += `Sharpe Ratio,${formatNumberCSV(account.sharpeRatio || 0)}\n`
    csvContent += `Sortino Ratio,${formatNumberCSV(account.sortinoRatio || 0)}\n`
    csvContent += `Calmar Ratio,${formatNumberCSV(account.calmarRatio || 0)}\n`
    csvContent += `Max Drawdown (${account.currency || 'USD'}),${formatNumberCSV(account.maxDrawdownValue || 0)}\n`
    if (account.maxDrawdownDate) {
      csvContent += `Data do Max Drawdown,${escapeCSV(account.maxDrawdownDate)}\n`
    }
    csvContent += `Juros (${account.currency || 'USD'}),${formatNumberCSV(account.interest || 0)}\n`
    csvContent += `Comissão (${account.currency || 'USD'}),${formatNumberCSV(account.commission || 0)}\n`
    csvContent += `Trades Abertos,${myfxbookData.openTrades?.length || 0}\n`
    csvContent += `Ordens Abertas,${myfxbookData.openOrders?.length || 0}\n`
    csvContent += `Total de Trades (últimos 50 disponíveis),${myfxbookData.history?.length || 0}\n`
    csvContent += '\n'
    
    // ===== SEÇÃO 3: HISTÓRICO MENSAL =====
    if (monthlyHistory && monthlyHistory.length > 0) {
      csvContent += 'HISTÓRICO MENSAL\n'
      csvContent += 'Período,Operações,Drawdown (%),Lucro Líquido,Retorno (%),Saldo Inicial,Saldo Final,Dias com Dados\n'
      monthlyHistory.forEach(month => {
        csvContent += `${escapeCSV(month.period)},`
        csvContent += `${month.trades},`
        csvContent += `${formatNumberCSV(month.drawdown)},`
        csvContent += `${formatNumberCSV(month.profit)},`
        // Calcular retorno percentual
        const returnPercent = month.startBalance && month.startBalance > 0
          ? ((month.endBalance || month.startBalance) - month.startBalance) / month.startBalance * 100
          : 0
        csvContent += `${formatNumberCSV(returnPercent)},`
        csvContent += `${formatNumberCSV(month.startBalance || 0)},`
        csvContent += `${formatNumberCSV(month.endBalance || 0)},`
        csvContent += `${month.days || 0}\n`
      })
      csvContent += '\n'
    }
    
    // ===== SEÇÃO 4: DADOS DIÁRIOS (Profit Diário) =====
    if (myfxbookData.dataDaily && Array.isArray(myfxbookData.dataDaily) && myfxbookData.dataDaily.length > 0) {
      let dataDailyArray = myfxbookData.dataDaily
      if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
        dataDailyArray = dataDailyArray.flat()
      }
      
      if (dataDailyArray.length > 0) {
        csvContent += 'DADOS DIÁRIOS (Profit Diário)\n'
        csvContent += 'Data,Profit,Balance,Equity\n'
        dataDailyArray.forEach(day => {
          const dateStr = day.date || day.time || ''
          const profit = parseFloat(day.profit || 0)
          const balance = parseFloat(day.balance || 0)
          const equity = parseFloat(day.equity || 0)
          
          csvContent += `${escapeCSV(dateStr)},`
          csvContent += `${formatNumberCSV(profit)},`
          csvContent += `${formatNumberCSV(balance)},`
          csvContent += `${formatNumberCSV(equity)}\n`
        })
        csvContent += '\n'
      }
    }
    
    // ===== SEÇÃO 5: TRADES ABERTOS =====
    if (myfxbookData.openTrades && myfxbookData.openTrades.length > 0) {
      csvContent += 'TRADES ABERTOS\n'
      csvContent += 'Símbolo,Tipo,Lotes,Preço Abertura,Preço Atual,Pips,P/L\n'
      myfxbookData.openTrades.forEach(trade => {
        csvContent += `${escapeCSV(trade.symbol || 'N/A')},`
        csvContent += `${escapeCSV(trade.side === 'buy' ? 'Compra' : 'Venda')},`
        csvContent += `${formatNumberCSV(trade.lots || 0)},`
        csvContent += `${formatNumberCSV(trade.openPrice || 0)},`
        csvContent += `${formatNumberCSV(trade.currentPrice || 0)},`
        csvContent += `${formatNumberCSV(trade.pips || 0)},`
        csvContent += `${formatNumberCSV(trade.profit || 0)}\n`
      })
      csvContent += '\n'
    }
    
    // ===== SEÇÃO 6: HISTÓRICO DE TRADES (últimos 50) =====
    if (myfxbookData.history && myfxbookData.history.length > 0) {
      csvContent += 'HISTÓRICO DE TRADES (Últimos 50)\n'
      csvContent += 'Data Abertura,Data Fechamento,Símbolo,Tipo,Lotes,Preço Abertura,Preço Fechamento,Pips,P/L\n'
      myfxbookData.history.forEach(trade => {
        const openTime = trade.openTime || trade.time || ''
        const closeTime = trade.closeTime || trade.time || ''
        csvContent += `${escapeCSV(openTime)},`
        csvContent += `${escapeCSV(closeTime)},`
        csvContent += `${escapeCSV(trade.symbol || 'N/A')},`
        csvContent += `${escapeCSV(trade.side === 'buy' ? 'Compra' : 'Venda')},`
        csvContent += `${formatNumberCSV(trade.lots || 0)},`
        csvContent += `${formatNumberCSV(trade.openPrice || 0)},`
        csvContent += `${formatNumberCSV(trade.closePrice || 0)},`
        csvContent += `${formatNumberCSV(trade.pips || 0)},`
        csvContent += `${formatNumberCSV(trade.profit || 0)}\n`
      })
      csvContent += '\n'
    }
    
    // ===== SEÇÃO 7: ORDENS ABERTAS =====
    if (myfxbookData.openOrders && myfxbookData.openOrders.length > 0) {
      csvContent += 'ORDENS ABERTAS\n'
      csvContent += 'Símbolo,Tipo,Lotes,Preço\n'
      myfxbookData.openOrders.forEach(order => {
        csvContent += `${escapeCSV(order.symbol || 'N/A')},`
        csvContent += `${escapeCSV(order.type || 'N/A')},`
        csvContent += `${formatNumberCSV(order.lots || 0)},`
        csvContent += `${formatNumberCSV(order.price || 0)}\n`
      })
    }
    
    // Criar blob com UTF-8 encoding
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio-performance-mt4-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const periods = [
    { id: 'hoje', label: 'Hoje' },
    { id: '7-dias', label: '7 dias' },
    { id: 'este-mes', label: 'Este mês' },
    { id: 'este-ano', label: 'Este ano' },
    { id: 'custom', label: 'Personalizado' },
  ]

  // Handler com debounce para evitar múltiplos cliques
  const handlePeriodChange = useCallback((periodId) => {
    // Se já está carregando, ignorar cliques adicionais
    if (isLoadingRef.current) {
      console.log('[Relatórios] Ignorando clique, já está carregando...')
      return
    }
    setSelectedPeriod(periodId)
  }, [])

  const handleCustomDateApply = useCallback(() => {
    // Se já está carregando, ignorar
    if (isLoadingRef.current) {
      console.log('[Relatórios] Ignorando aplicação de data, já está carregando...')
      return
    }
    
    if (customDates.startDate && customDates.endDate) {
      if (new Date(customDates.startDate) > new Date(customDates.endDate)) {
        alert('A data inicial deve ser anterior à data final')
        return
      }
      setSelectedPeriod('custom')
      setShowDatePicker(false)
    } else {
      alert('Por favor, selecione ambas as datas')
    }
  }, [customDates])

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-10 lg:mb-12 gap-4 relative">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] mb-2 sm:mb-2.5 tracking-[-0.02em]">Relatórios de Performance</h1>
            <p className="text-sm sm:text-[15px] text-[#6b7280] font-normal">
              Análise detalhada da evolução e resultados institucionais da sua conta.
            </p>
            {myfxbookData?.period && (
              <p className="text-xs text-[#9ca3af] mt-1">
                Período: {new Date(myfxbookData.period.startDate).toLocaleDateString('pt-BR')} até {new Date(myfxbookData.period.endDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
            {/* Filter Pills */}
            <div className="flex bg-white rounded-xl p-1 border border-[#ebebeb] shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-x-auto scrollbar-hide">
              {periods.map((period) => (
                <button
                  key={period.id}
                  className={`px-3 sm:px-6 py-2 text-xs sm:text-[13px] font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedPeriod === period.id
                      ? 'bg-white text-[#00afaa] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#f0f0f0]'
                      : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                  onClick={() => {
                    if (period.id === 'custom') {
                      setShowDatePicker(!showDatePicker)
                    } else {
                      handlePeriodChange(period.id)
                      setShowDatePicker(false)
                    }
                  }}
                  disabled={loading || isLoadingRef.current}
                >
                  {period.label}
                </button>
              ))}
            </div>
            
            {/* Date Picker (aparece quando custom está selecionado) */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 bg-white rounded-xl p-4 border border-[#ebebeb] shadow-lg z-10 flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#6b7280]">Data Inicial</label>
                  <input
                    type="date"
                    value={customDates.startDate}
                    onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                    className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#6b7280]">Data Final</label>
                  <input
                    type="date"
                    value={customDates.endDate}
                    onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                    className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCustomDateApply}
                    className="px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-semibold hover:bg-[#009994] transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => {
                      setShowDatePicker(false)
                      setCustomDates({ startDate: '', endDate: '' })
                    }}
                    className="px-4 py-2 bg-[#f3f4f6] text-[#6b7280] rounded-lg text-sm font-semibold hover:bg-[#e5e7eb] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {/* Export Button */}
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 h-11 bg-white text-[#111827] border border-[#e5e7eb] rounded-xl text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#00ff88] hover:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] hover:text-[#00afaa]"
            >
              <Icon icon="lucide:download" className="text-base" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
          {/* Retorno Total */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[120px] sm:h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">RETORNO TOTAL</span>
              <div className="w-8 h-8 rounded-[10px] bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#059669]">
                <Icon icon="lucide:trending-up" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">
                {loading ? '...' : formatPercentBR(kpis.totalReturn)}
              </div>
              <div className="text-xs sm:text-[13px] text-[#9ba0aa] font-normal">Desde o início</div>
            </div>
          </div>

          {/* Lucro Líquido */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">LUCRO LÍQUIDO</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
                <Icon icon="lucide:dollar-sign" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">
                {loading ? '...' : formatCurrencyBR(kpis.netProfit)}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">Acumulado no ano</div>
            </div>
          </div>

          {/* Fator de Lucro */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">FATOR DE LUCRO</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
                <Icon icon="lucide:pie-chart" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#111827] tracking-tight leading-none mb-1.5">
                {loading ? '...' : kpis.profitFactor.toFixed(2)}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.profitFactor >= 2 ? 'Alta eficiência' : kpis.profitFactor >= 1 ? 'Eficiência moderada' : 'Baixa eficiência'}
              </div>
            </div>
          </div>

          {/* Drawdown Máx. */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">DRAWDOWN MÁX.</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#fef2f2] flex items-center justify-center text-[#e53935]">
                <Icon icon="lucide:activity" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#e53935] tracking-tight leading-none mb-1.5">
                {loading ? '...' : `-${formatNumberBR(kpis.maxDrawdown)}%`}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.maxDrawdown < 5 ? 'Risco controlado' : kpis.maxDrawdown < 10 ? 'Risco moderado' : 'Risco elevado'}
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        {myfxbookData?.connected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
            {/* Trades Abertos */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">TRADES ABERTOS</span>
                <Icon icon="lucide:trending-up" className="text-base text-[#059669]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827]">{kpis.openTrades}</div>
            </div>

            {/* Ordens Abertas */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">ORDENS ABERTAS</span>
                <Icon icon="lucide:list" className="text-base text-[#6b7280]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827]">{kpis.openOrders}</div>
            </div>

            {/* Total de Trades */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">TOTAL TRADES</span>
                <Icon icon="lucide:bar-chart-2" className="text-base text-[#6b7280]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827]">{kpis.totalTrades}</div>
              {kpis.totalTrades < 50 && myfxbookData?.history?.length > 0 && (
                <div className="text-[10px] text-[#9ca3af] mt-1">
                  * Limitado aos últimos 50 trades da API
                </div>
              )}
            </div>

            {/* Ganho no Período */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">GANHO PERÍODO</span>
                <Icon icon="lucide:percent" className="text-base text-[#059669]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#059669]">
                {loading ? '...' : kpis.gain ? formatPercentBR(kpis.gain) : 'N/A'}
              </div>
            </div>
          </div>
        )}


        {/* Trades Abertos */}
        {myfxbookData?.openTrades && myfxbookData.openTrades.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em]">Trades Abertos</h3>
              <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
                {myfxbookData.openTrades.length} {myfxbookData.openTrades.length === 1 ? 'trade' : 'trades'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Símbolo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Lotes</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Preço Abertura</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {myfxbookData.openTrades.map((trade, index) => (
                    <tr key={index} className="border-b border-[#f9fafb] hover:bg-[#f3f4f6]">
                      <td className="py-3 px-4 text-sm font-semibold text-[#111827]">{trade.symbol || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-[#6b7280]">{trade.side === 'buy' ? 'Compra' : 'Venda'}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(trade.lots || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(trade.openPrice || 0).toFixed(5)}</td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${parseFloat(trade.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#e53935]'}`}>
                        {formatCurrencyBR(trade.profit || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ordens Abertas */}
        {myfxbookData?.openOrders && myfxbookData.openOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em]">Ordens Abertas</h3>
              <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
                {myfxbookData.openOrders.length} {myfxbookData.openOrders.length === 1 ? 'ordem' : 'ordens'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Símbolo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Lotes</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {myfxbookData.openOrders.map((order, index) => (
                    <tr key={index} className="border-b border-[#f9fafb] hover:bg-[#f3f4f6]">
                      <td className="py-3 px-4 text-sm font-semibold text-[#111827]">{order.symbol || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-[#6b7280]">{order.type || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(order.lots || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(order.price || 0).toFixed(5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Relatório de Profit Diário - MyFXBook */}
        {(() => {
          // Verificar se dataDaily existe e tem dados (desaninhar se necessário)
          let dataDailyArray = myfxbookData?.dataDaily || []
          if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
            dataDailyArray = dataDailyArray.flat()
          }
          return dataDailyArray.length > 0
        })() && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em] mb-1">Relatório de Profit Diário</h3>
                <p className="text-sm text-[#6b7280]">
                  Dados obtidos diretamente do MT4 - {profitStats.profitByDay.length} dias registrados
                </p>
              </div>
              <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
                <Icon icon="lucide:check-circle" className="inline mr-1" />
                Dados em Tempo Real
              </span>
            </div>

            {/* Cards de Estatísticas de Profit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold opacity-90 uppercase">Profit Total</span>
                  <Icon icon="lucide:trending-up" className="text-xl" />
                </div>
                <div className="text-2xl font-bold">{formatCurrencyBR(profitStats.totalProfit)}</div>
                <div className="text-xs opacity-80 mt-1">
                  {profitStats.profitByDay.length} dias analisados
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold opacity-90 uppercase">Média Diária</span>
                  <Icon icon="lucide:bar-chart-3" className="text-xl" />
                </div>
                <div className="text-2xl font-bold">{formatCurrencyBR(profitStats.averageDailyProfit)}</div>
                <div className="text-xs opacity-80 mt-1">
                  Por dia útil
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold opacity-90 uppercase">Melhor Dia</span>
                  <Icon icon="lucide:arrow-up-circle" className="text-xl" />
                </div>
                <div className="text-2xl font-bold">
                  {profitStats.bestDay ? formatCurrencyBR(profitStats.bestDay.profit) : 'N/A'}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {profitStats.bestDay ? profitStats.bestDay.date.toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#dc2626] to-[#991b1b] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold opacity-90 uppercase">Pior Dia</span>
                  <Icon icon="lucide:arrow-down-circle" className="text-xl" />
                </div>
                <div className="text-2xl font-bold">
                  {profitStats.worstDay ? formatCurrencyBR(profitStats.worstDay.profit) : 'N/A'}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {profitStats.worstDay ? profitStats.worstDay.date.toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>
            </div>

            {/* Cards Adicionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#166534] mb-1">Dias com Profit</div>
                    <div className="text-2xl font-bold text-[#059669]">{profitStats.profitDays}</div>
                    <div className="text-xs text-[#6b7280] mt-1">
                      {profitStats.profitByDay.length > 0 
                        ? `${((profitStats.profitDays / profitStats.profitByDay.length) * 100).toFixed(1)}% dos dias`
                        : '0%'}
                    </div>
                  </div>
                  <Icon icon="lucide:check-circle-2" className="text-3xl text-[#10b981]" />
                </div>
              </div>

              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#991b1b] mb-1">Dias com Loss</div>
                    <div className="text-2xl font-bold text-[#dc2626]">{profitStats.lossDays}</div>
                    <div className="text-xs text-[#6b7280] mt-1">
                      {profitStats.profitByDay.length > 0 
                        ? `${((profitStats.lossDays / profitStats.profitByDay.length) * 100).toFixed(1)}% dos dias`
                        : '0%'}
                    </div>
                  </div>
                  <Icon icon="lucide:x-circle" className="text-3xl text-[#ef4444]" />
                </div>
              </div>
            </div>

            {/* Tabela de Profit Diário */}
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f4f6] bg-[#fafafa]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      <Icon icon="lucide:calendar" className="inline mr-2" />
                      Data
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      <Icon icon="lucide:dollar-sign" className="inline mr-2" />
                      Profit Diário
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      <Icon icon="lucide:trending-up" className="inline mr-2" />
                      Balance
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      <Icon icon="lucide:activity" className="inline mr-2" />
                      Equity
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      <Icon icon="lucide:bar-chart" className="inline mr-2" />
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profitStats.profitByDay.slice(0, 30).map((day, index) => {
                    // Buscar dados correspondentes (desaninhar se necessário)
                    let dataDailyArray = myfxbookData.dataDaily || []
                    if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
                      dataDailyArray = dataDailyArray.flat()
                    }
                    
                    const dailyData = dataDailyArray.find(d => {
                      const dateStr = d.date || d.time || d.openTime || d.closeTime
                      const dataDate = parseMyFXBookDate(dateStr)
                      return dataDate && !isNaN(dataDate.getTime()) && dataDate.toDateString() === day.date.toDateString()
                    })
                    const isProfit = day.profit >= 0
                    return (
                      <tr key={index} className="border-b border-[#f9fafb] hover:bg-[#f3f4f6] transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-[#111827]">
                          {!isNaN(day.date.getTime()) ? day.date.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            weekday: 'short'
                          }) : 'Data inválida'}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-semibold ${
                          isProfit ? 'text-[#059669]' : 'text-[#dc2626]'
                        }`}>
                          {isProfit ? '+' : ''}{formatCurrencyBR(day.profit)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-[#6b7280]">
                          {day.balance ? formatCurrencyBR(day.balance) : (dailyData ? formatCurrencyBR(parseFloat(dailyData.balance || 0)) : '-')}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-[#6b7280]">
                          {day.equity ? formatCurrencyBR(day.equity) : (dailyData ? formatCurrencyBR(parseFloat(dailyData.equity || 0)) : '-')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isProfit 
                              ? 'bg-[#dcfce7] text-[#166534]' 
                              : 'bg-[#fee2e2] text-[#991b1b]'
                          }`}>
                            <Icon icon={isProfit ? 'lucide:trending-up' : 'lucide:trending-down'} className="text-sm" />
                            {isProfit ? 'Profit' : 'Loss'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View for Profit Diário */}
            <div className="lg:hidden space-y-3">
              {profitStats.profitByDay.slice(0, 30).map((day, index) => {
                let dataDailyArray = myfxbookData.dataDaily || []
                if (dataDailyArray.length > 0 && Array.isArray(dataDailyArray[0])) {
                  dataDailyArray = dataDailyArray.flat()
                }
                
                const dailyData = dataDailyArray.find(d => {
                  const dateStr = d.date || d.time || d.openTime || d.closeTime
                  const dataDate = parseMyFXBookDate(dateStr)
                  return dataDate && !isNaN(dataDate.getTime()) && dataDate.toDateString() === day.date.toDateString()
                })
                const isProfit = day.profit >= 0
                return (
                  <div key={index} className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-semibold text-[#111827] mb-1">
                          {!isNaN(day.date.getTime()) ? day.date.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            weekday: 'short'
                          }) : 'Data inválida'}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isProfit 
                          ? 'bg-[#dcfce7] text-[#166534]' 
                          : 'bg-[#fee2e2] text-[#991b1b]'
                      }`}>
                        <Icon icon={isProfit ? 'lucide:trending-up' : 'lucide:trending-down'} className="text-sm" />
                        {isProfit ? 'Profit' : 'Loss'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e5e7eb]">
                      <div>
                        <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Profit Diário</div>
                        <div className={`text-base font-bold ${isProfit ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
                          {isProfit ? '+' : ''}{formatCurrencyBR(day.profit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Balance</div>
                        <div className="text-sm font-semibold text-[#111827]">
                          {day.balance ? formatCurrencyBR(day.balance) : (dailyData ? formatCurrencyBR(parseFloat(dailyData.balance || 0)) : '-')}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Equity</div>
                        <div className="text-sm font-semibold text-[#111827]">
                          {day.equity ? formatCurrencyBR(day.equity) : (dailyData ? formatCurrencyBR(parseFloat(dailyData.equity || 0)) : '-')}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {profitStats.profitByDay.length > 30 && (
              <div className="mt-4 text-center text-sm text-[#6b7280]">
                Mostrando os 30 dias mais recentes de {profitStats.profitByDay.length} dias disponíveis
              </div>
            )}
          </div>
        )}

        {/* History Table */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-bold text-[#111827] tracking-[-0.01em]">Histórico Mensal</h3>
            <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
              Últimos 12 meses
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_0.8fr] px-6 py-4 border-b border-[#f3f4f6]">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
                <Icon icon="lucide:calendar" className="text-sm mr-1.5" />
                Período
              </div>
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
                <Icon icon="lucide:calendar-days" className="text-sm mr-1.5" />
                Dias com Dados
              </div>
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
                <Icon icon="lucide:trending-down" className="text-sm mr-1.5" />
                Drawdown
              </div>
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
                <Icon icon="lucide:dollar-sign" className="text-sm mr-1.5" />
                Lucro Líquido
              </div>
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
                <Icon icon="lucide:percent" className="text-sm mr-1.5" />
                Retorno
              </div>
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center justify-end">
                Relatório
              </div>
            </div>

            {/* Table Rows */}
            {loading ? (
              <div className="px-6 py-12 text-center text-[#6b7280]">Carregando dados...</div>
            ) : monthlyHistory.length > 0 ? (
              monthlyHistory.map((row, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_0.8fr] items-center px-6 py-6 border-b border-[#f9fafb] transition-all hover:bg-[#f3f4f6] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                    index % 2 === 0 ? 'bg-[#fafafa]' : ''
                  } ${index === monthlyHistory.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className="text-sm font-semibold text-[#111827]">{row.period}</div>
                  <div className="text-sm text-[#6b7280]">{row.days || 0} dias</div>
                  <div className={`text-sm ${row.isWarning ? 'text-[#f59e0b] font-semibold' : 'text-[#6b7280]'}`}>
                    {row.drawdownFormatted}
                  </div>
                  <div className="text-sm text-[#6b7280]">{row.profitFormatted}</div>
                  <div>
                    {row.isPositive ? (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold min-w-[64px] bg-[rgba(0,255,136,0.08)] text-[#059669] border border-[rgba(0,255,136,0.15)]">
                        {row.returnFormatted}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold min-w-[64px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                        {row.returnFormatted}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleExportCSV}
                      className="w-8 h-8 rounded-lg border border-transparent bg-transparent flex items-center justify-center text-[#6b7280] cursor-pointer transition-all hover:bg-white hover:border-[#e5e7eb] hover:text-[#111827] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                      title="Baixar relatório CSV"
                      data-media-type="banani-button"
                    >
                      <Icon icon="lucide:file-text" className="text-base" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-[#6b7280]">
                {myfxbookData ? 'Nenhum dado histórico disponível' : 'Conecte sua conta MT4 para ver os relatórios'}
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="py-12 text-center text-[#6b7280]">Carregando dados...</div>
            ) : monthlyHistory.length > 0 ? (
              monthlyHistory.map((row, index) => (
                <div
                  key={index}
                  className="bg-[#fafafa] rounded-xl p-4 border border-[#f3f4f6]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-bold text-[#111827] mb-1">{row.period}</div>
                      <div className="text-xs text-[#6b7280] flex items-center gap-1">
                        <Icon icon="lucide:calendar-days" className="text-xs" />
                        {row.days || 0} dias com dados
                      </div>
                    </div>
                    <div>
                      {row.isPositive ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-[rgba(0,255,136,0.08)] text-[#059669] border border-[rgba(0,255,136,0.15)]">
                          {row.returnFormatted}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                          {row.returnFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e5e7eb]">
                    <div>
                      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Drawdown</div>
                      <div className={`text-sm font-semibold ${row.isWarning ? 'text-[#f59e0b]' : 'text-[#6b7280]'}`}>
                        {row.drawdownFormatted}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Lucro Líquido</div>
                      <div className="text-sm font-semibold text-[#111827]">{row.profitFormatted}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#e5e7eb] flex justify-end">
                    <button 
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] cursor-pointer transition-all hover:bg-[#f9fafb] hover:border-[#d1d5db] hover:text-[#111827] active:scale-95"
                      title="Baixar relatório CSV"
                      data-media-type="banani-button"
                    >
                      <Icon icon="lucide:file-text" className="text-sm" />
                      <span className="text-xs font-medium">Relatório</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-[#6b7280]">
                {myfxbookData ? 'Nenhum dado histórico disponível' : 'Conecte sua conta MT4 para ver os relatórios'}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RelatoriosPerformancePage
