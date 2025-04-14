import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import trackablesRoutes from './routes/trackables';
import tasksRoutes from './routes/tasks';
import lookupRoutes from './routes/lookup';
import { aiRouter } from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('API is running');
});

app.use('/trackables', trackablesRoutes);
app.use('/tasks', tasksRoutes);
app.use('/lookup', lookupRoutes);
app.use('/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});