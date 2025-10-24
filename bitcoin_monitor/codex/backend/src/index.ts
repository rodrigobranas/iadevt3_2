import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'node:https';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// In-memory cache for bitcoin data (refresh every 10 seconds)
type BitcoinInfo = {
  price: string;
  timestamp: number;
  '24h_price_change': string;
  '24h_price_change_percent': string;
  '24h_high': string;
  '24h_low': string;
  '24h_volume': string;
};

let cachedData: BitcoinInfo | null = null;
let lastFetch = 0; // epoch ms
const MIN_TTL_MS = 10_000; // 10 seconds

const API_URL = 'https://api.api-ninjas.com/v1/bitcoin';
const API_KEY = 'kIwRwVNydIUrJzArE4LajA==xX81Zit9JC2zePiQ';

function fetchBitcoinData(): Promise<BitcoinInfo> {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const options: https.RequestOptions = {
      method: 'GET',
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers: {
        'X-Api-Key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data) as BitcoinInfo;
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

app.get('/bitcoin-info', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedData && now - lastFetch < MIN_TTL_MS) {
      return res.json(cachedData);
    }

    const fresh = await fetchBitcoinData();
    cachedData = fresh;
    lastFetch = Date.now();

    return res.json(fresh);
  } catch (error: any) {
    console.error('Failed to fetch bitcoin data:', error?.message || error);
    if (cachedData) {
      return res.json(cachedData);
    }
    return res.status(502).json({ error: 'Failed to fetch bitcoin info' });
  }
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
