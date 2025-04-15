// src/routes/tasks.ts
import express from 'express';
import { getTasks, createTask } from '../controllers/tasks';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTasks);    // <-- this handles ?trackable=XYZ
router.post('/', createTask); // existing logic

export default router;
