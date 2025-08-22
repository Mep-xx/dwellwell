// dwellwell-api/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

const app = express();

// If behind a proxy (Render/Heroku/Nginx), set TRUST_PROXY=1
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, cb) => {
      const allowed =
        (process.env.WEB_ORIGIN || 'http://localhost:5173')
          .split(',')
          .map(s => s.trim());
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Serve uploads (images, etc.)
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    etag: true,
    lastModified: true,
    maxAge: '7d',
  })
);

// API routes
app.use('/api', routes);

// 404 + centralized error handler
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    if (process.env.WEB_ORIGIN) {
      console.log(`CORS allowed origins: ${process.env.WEB_ORIGIN}`);
    }
  });
}

export default app;
