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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:5173', // not '*'
  credentials: true,
}));
app.use(express.json());

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

// Serve Static Files (Home Images)
import uploadHomeImageRoute from './routes/homes/upload-image';
app.use('/api', uploadHomeImageRoute);

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});