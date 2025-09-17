//dwellwell-api/src/index.ts
// dwellwell-api/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import routes from './routes';
import authRouter from './routes/auth';

const app = express();

app.set('trust proxy', 1);

// --- CORS ---
const DEFAULT_ORIGINS = ['http://localhost:5173'];
const EXTRA = (process.env.WEB_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...EXTRA]));

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());

// ---- PUBLIC ----
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.use('/api/auth', authRouter);

app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1y', index: false }),
);

// ---- EVERYTHING ELSE (protected or mixed) ----
// One place to mount all feature routers:
app.use('/api', routes);

// ---- DEV route map ----
if (process.env.NODE_ENV !== 'production') {
  app.get('/__routes', (_req, res) => {
    function describeLayer(layer: any, prefix = ''): string[] {
      const out: string[] = [];
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase())
          .join(',');
        out.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        const path = layer.regexp && layer.regexp.source
          ? layer.regexp.source
              .replace('^\\', '/')
              .replace('\\/?(?=\\/|$)', '')
              .replace('(?=\\/|$)', '')
              .replace('^', '')
              .replace('$', '')
          : '';
        const newPrefix = path && path !== '/' ? `${prefix}${path}` : prefix;
        layer.handle.stack.forEach((l: any) => out.push(...describeLayer(l, newPrefix)));
      }
      return out;
    }
    const stack = (app as any)._router?.stack ?? [];
    const lines = stack.flatMap((layer: any) => describeLayer(layer, ''));
    res.json({ routes: lines.sort() });
  });
}

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err?.status || 500).json({
    error: 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Unexpected error' : err?.message ?? 'Unknown error',
  });
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`API on :${PORT} | CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
