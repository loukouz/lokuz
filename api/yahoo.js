// Adição ao api/yahoo.js para carregar candles de múltiplos tickers
if (req.query.sparklines === 'true') {
    const symbols = (req.query.symbols || 'EWZ,VALE3.SA,PETR4.SA,ITUB4.SA,BBDC4.SA,BOVA11.SA').split(',');
    
    const promessas = symbols.map(async (sym) => {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=15m&range=1d&includePrePost=false`;
            const r = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (!r.ok) return null;
            const data = await r.json();
            const resChart = data?.chart?.result?.[0];
            const meta = resChart?.meta;
            const closes = resChart?.indicators?.quote?.[0]?.close || [];
            
            return {
                ticker: sym.replace('.SA', ''),
                regularMarketPrice: meta?.regularMarketPrice || 0,
                chartPreviousClose: meta?.chartPreviousClose || 0,
                regularMarketChangePercent: ((meta?.regularMarketPrice - meta?.chartPreviousClose) / meta?.chartPreviousClose) * 100,
                historico: closes.filter(c => c !== null)
            };
        } catch {
            return null;
        }
    });

    const resultados = (await Promise.all(promessas)).filter(Boolean);
    return res.status(200).json(resultados);
}
