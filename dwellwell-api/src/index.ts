import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import trackablesRoutes from './routes/trackables';
import tasksRoutes from './routes/tasks';
import lookupRoutes from './routes/lookup';
import homeRoutes from './routes/homes';
import aiRoutes from './routes/ai';
import authRouter from './routes/auth';
import mapboxRoutes from './routes/mapbox';
import taskSummaryRoute from './routes/homes/summary';
import roomRoutes from './routes/rooms';
import uploadHomeImageRoute from './routes/uploads/home-image';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('API is running');
});

app.use('/api', mapboxRoutes);
app.use('/api/trackables', trackablesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRouter);
app.use('/api/homes', homeRoutes);
app.use('/api/homes', taskSummaryRoute);
app.use('/api/mapbox', mapboxRoutes);
app.use('/api/rooms', roomRoutes);

// Serve static images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Mount the upload route
app.use('/api', uploadHomeImageRoute);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
