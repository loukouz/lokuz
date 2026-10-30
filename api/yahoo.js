// api/yahoo.js — Serverless Function na Vercel (Suporta Cotações e Gráficos do Yahoo)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

    const { chart, symbol = 'EWZ', symbols = 'EWZ,ES=F,BRL=X,DX-Y.NYB,^TNX,CL=F', interval = '15m', range = '5d' } = req.query;

    try {
        let url;
        if (chart === '1' || chart === 'true') {
            // Endpoint de Velas/Candles do Yahoo Finance
            url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
        } else {
            // Endpoint de Cotações para a Fita Superior
            url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Yahoo respondeu com status ${response.status}`);
        }

        const data = await response.json();

        if (chart === '1' || chart === 'true') {
            return res.status(200).json(data?.chart?.result?.[0] || null);
        } else {
            return res.status(200).json(data?.quoteResponse?.result || []);
        }
    } catch (error) {
        return res.status(500).json({ 
            erro: 'Falha ao consultar Yahoo Finance', 
            detalhe: error.message 
        });
    }
}
