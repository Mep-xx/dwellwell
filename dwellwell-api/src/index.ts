import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import trackablesRoutes from './routes/trackables';
import tasksRoutes from './routes/tasks';
import lookupRoutes from './routes/lookup';
import { aiRouter } from './routes/ai';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('API is running');
});

app.use('/api/trackables', trackablesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/ai', aiRouter);
app.use('/api/auth', authRouter); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
