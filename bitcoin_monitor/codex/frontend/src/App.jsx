import { useEffect, useMemo, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [btc, setBtc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const REFRESH_MS = 10 * 60 * 1000 // 10 minutes

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/health')
        if (response.ok) {
          setApiStatus('online')
        } else {
          setApiStatus('offline')
        }
      } catch (error) {
        setApiStatus('offline')
      }
    }

    checkApiStatus()
    const interval = setInterval(checkApiStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'checking':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const fetchBitcoinInfo = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3000/bitcoin-info')
      if (!res.ok) throw new Error('Falha ao obter dados')
      const json = await res.json()
      setBtc(json)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Não foi possível atualizar os dados no momento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // initial fetch
    fetchBitcoinInfo()
    // auto refresh every 10 minutes
    const id = setInterval(fetchBitcoinInfo, REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchBitcoinInfo])

  const nfUsd = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }), [])
  const nfPlain = useMemo(() => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }), [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-8 gap-8 relative">
      <div className="w-full max-w-4xl flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Bitcoin Monitor</h1>
        <div className="flex items-center gap-3">
          <Button onClick={fetchBitcoinInfo} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar agora'}
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full backdrop-blur-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <span className="text-xs text-muted-foreground font-medium">API</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-4xl text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 2 x 3 matrix: price, 24h % change, 24h USD change, 24h high, 24h low, 24h volume */}
        <div className="col-span-1 md:col-span-1 bg-card border rounded-lg p-4 flex flex-col">
          <span className="text-xs text-muted-foreground">Preço atual</span>
          <span className="text-2xl md:text-3xl font-semibold">
            {btc ? nfUsd.format(parseFloat(btc.price)) : '—'}
          </span>
        </div>

        <div className="col-span-1 md:col-span-1 bg-card border rounded-lg p-4 flex flex-col">
          <span className="text-xs text-muted-foreground">Variação 24h %</span>
          <span className={`text-2xl md:text-3xl font-semibold ${btc && parseFloat(btc['24h_price_change_percent']) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {btc ? `${nfPlain.format(parseFloat(btc['24h_price_change_percent']))}%` : '—'}
          </span>
        </div>

        <div className="col-span-1 md:col-span-1 bg-card border rounded-lg p-4 flex flex-col">
          <span className="text-xs text-muted-foreground">Variação 24h (USD)</span>
          <span className={`text-2xl md:text-3xl font-semibold ${btc && parseFloat(btc['24h_price_change']) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {btc ? nfUsd.format(parseFloat(btc['24h_price_change'])) : '—'}
          </span>
        </div>

        <div className="col-span-1 md:col-span-1 bg-card border rounded-lg p-4 flex flex-col">
          <span className="text-xs text-muted-foreground">Máxima 24h</span>
          <span className="text-2xl md:text-3xl font-semibold">
            {btc ? nfUsd.format(parseFloat(btc['24h_high'])) : '—'}
          </span>
        </div>

        <div className="col-span-1 md:col-span-1 bg-card border rounded-lg p-4 flex flex-col">
          <span className="text-xs text-muted-foreground">Mínima 24h</span>
          <span className="text-2xl md:text-3xl font-semibold">
            {btc ? nfUsd.format(parseFloat(btc['24h_low'])) : '—'}
          </span>
        </div>

        <div className="col-span-1 md:col-span-1 bg-card border rounded-lg p-4 flex flex-col">
          <span className="text-xs text-muted-foreground">Volume 24h</span>
          <span className="text-2xl md:text-3xl font-semibold">
            {btc ? nfPlain.format(parseFloat(btc['24h_volume'])) : '—'}
          </span>
        </div>
      </div>

      <div className="w-full max-w-4xl text-sm text-muted-foreground">
        <span>
          {lastUpdated
            ? `Última atualização: ${lastUpdated.toLocaleString()} • Intervalo: ${Math.round(REFRESH_MS / 60000)} minutos`
            : `Carregando dados... Intervalo: ${Math.round(REFRESH_MS / 60000)} minutos`}
        </span>
      </div>

      <div className="absolute bottom-8 flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full backdrop-blur-sm">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <span className="text-sm text-muted-foreground font-medium">API Status</span>
      </div>
    </div>
  )
}

export default App
