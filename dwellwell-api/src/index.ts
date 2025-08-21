// dwellwell-api/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRouter from './routes/auth';
import aiRoutes from './routes/ai';
import lookupRoutes from './routes/lookup';
import mapboxRoutes from './routes/mapbox';
import homeRoutes from './routes/homes';
import roomRoutes from './routes/rooms';
import tasksRoutes from './routes/tasks';
import trackablesRoutes from './routes/trackables';

// Admin
import adminTaskTemplateRoutes from './routes/admin/task-templates';
import usersAdminRoutes from './routes/admin/users';
import adminMetrics from './routes/admin/adminMetrics';
import adminTrackableList from './routes/admin/adminTrackableList';
import adminTrackableResources from './routes/admin/adminTrackableResources';
import adminHomesRoutes from './routes/admin/homes';

// Homes extras
import taskSummaryRoute from './routes/homes/summary';
import uploadHomeImageRoute from './routes/homes/upload-image';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Core API
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/mapbox', mapboxRoutes);
app.use('/api/homes', homeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/trackables', trackablesRoutes);

// Admin API
app.use('/api/admin/task-templates', adminTaskTemplateRoutes);
app.use('/api/admin/users', usersAdminRoutes);
app.use('/api/admin/metrics', adminMetrics);
app.use('/api/admin/trackables', adminTrackableList);
app.use('/api/admin/trackables', adminTrackableResources);
app.use('/api/admin/homes', adminHomesRoutes);

// Static uploads (manuals, images, etc.)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Homes extras — MOUNT UNDER /api/homes so the FE URLs line up
app.use('/api/homes', taskSummaryRoute);
app.use('/api/homes', uploadHomeImageRoute);

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
