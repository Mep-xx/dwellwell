import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import trackablesRoutes from './routes/trackables';
import tasksRoutes from './routes/tasks';

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});