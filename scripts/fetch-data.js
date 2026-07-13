const https = require('https');
const fs = require('fs');
const path = require('path');

const SYMBOLS = {
  kospi:   '^KS11',
  sp500:   '^GSPC',
  nasdaq:  '^IXIC',
  dow:     '^DJI',
  samsung: '005930.KS',
  hynix:   '000660.KS',
  micron:  'MU'
};

function fetchData(symbol) {
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => {
      resolve(null);
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const results = {};
  
  for (const [key, symbol] of Object.entries(SYMBOLS)) {
    try {
      const data = await fetchData(symbol);
      results[key] = data;
      console.log(`Fetched ${key}: ${data ? 'OK' : 'FAIL'}`);
    } catch (e) {
      results[key] = null;
      console.error(`Error fetching ${key}:`, e.message);
    }
    await sleep(1000); // 避免速率限制
  }
  
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  const outputPath = path.join(dataDir, 'stocks.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    data: results
  }, null, 2));
  
  console.log(`Data saved to ${outputPath}`);
}

main();
