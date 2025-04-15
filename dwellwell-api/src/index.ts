import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import trackablesRoutes from './routes/trackables';
import tasksRoutes from './routes/tasks';
import lookupRoutes from './routes/lookup';
import { aiRouter } from './routes/ai';
import authRouter from './routes/auth'; // ✅ Corrected

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
app.use('/auth', authRouter); // ✅ Matches the corrected import

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
