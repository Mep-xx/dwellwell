import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import authRoutes from './routes/auth';
import homesRouter from './routes/homes';
import path from 'path';

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

// Core middleware
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Morgan (combined)
app.use(morgan('combined'));

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), {
  maxAge: "1y",
  index: false,
}));
/**
 * IMPORTANT:
 * - We mount ALL API routes under /api
 * - The main API router mounts /homes
 * - We ALSO expose a direct /api/homes mount as belt‑and‑suspenders
 */
app.use('/api', routes);
app.use('/api', homesRouter);

/**
 * Route introspection — see what Express has registered at runtime
 * NOTE: do NOT expose this in production.
 */
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

// 404 fallthrough
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res
    .status(err?.status || 500)
    .json({ error: 'SERVER_ERROR', message: process.env.NODE_ENV === 'production' ? 'Unexpected error' : err?.message ?? 'Unknown error' });
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origins: ${CLIENT_ORIGIN}`);
});
