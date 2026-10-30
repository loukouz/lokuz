// api/yahoo.js — Serverless Function Vercel (Sem bloqueio de crumb do Yahoo)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

    const { chart, symbol = 'EWZ', symbols = 'EWZ,ES=F,BRL=X,DX-Y.NYB,^TNX,CL=F', interval = '15m', range = '5d' } = req.query;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    };

    try {
        // Modo 1: Retorna candles históricos para o gráfico nativo Chart.js
        if (chart === '1' || chart === 'true') {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`Yahoo Chart respondeu status ${response.status}`);
            const data = await response.json();
            return res.status(200).json(data?.chart?.result?.[0] || null);
        }

        // Modo 2: Retorna cotações atuais para a fita superior usando /v8/ (imune a 401 Crumb)
        const listaTickers = symbols.split(',');
        const promessas = listaTickers.map(async (ticker) => {
            try {
                const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
                const r = await fetch(u, { headers });
                if (!r.ok) return null;
                const json = await r.json();
                const meta = json?.chart?.result?.[0]?.meta;
                if (!meta) return null;

                const preco = meta.regularMarketPrice || 0;
                const prev = meta.chartPreviousClose || preco;
                const pct = prev > 0 ? ((preco - prev) / prev) * 100 : 0;

                return {
                    symbol: ticker,
                    regularMarketPrice: preco,
                    regularMarketChangePercent: pct
                };
            } catch {
                return null;
            }
        });

        const resultados = await Promise.all(promessas);
        const cotacoesValidas = resultados.filter(Boolean);

        return res.status(200).json(cotacoesValidas);

    } catch (error) {
        return res.status(500).json({ erro: 'Falha na ponte com Yahoo Finance', detalhe: error.message });
    }
}
