import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import trackablesRoutes from './routes/trackables';
import tasksRoutes from './routes/tasks';
import lookupRoutes from './routes/lookup';
import homeRoutes from './routes/homes'; // <-- homes routes (including uploads now!)
import aiRoutes from './routes/ai';
import authRouter from './routes/auth';
import mapboxRoutes from './routes/mapbox';
import taskSummaryRoute from './routes/homes/summary';
import roomRoutes from './routes/rooms';
import adminTaskTemplateRoutes from './routes/admin/task-templates';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cookieParser());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// 🔍 Log all incoming requests
app.use((req, res, next) => {
  next();
});

app.get('/health', (req, res) => {
  res.send('API is running');
});

// Mount Routes
app.use('/api/trackables', trackablesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRouter);
app.use('/api/homes', homeRoutes);
app.use('/api/homes', taskSummaryRoute);
app.use('/api/mapbox', mapboxRoutes);
app.use('/api/rooms', roomRoutes);
app.patch('/api/rooms/:id', roomRoutes);
app.use('/api/admin/task-templates', adminTaskTemplateRoutes);

// Serve Static Files (Home Images)
import uploadHomeImageRoute from './routes/homes/upload-image';
app.use('/api', uploadHomeImageRoute);

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
