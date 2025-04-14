// src/routes/tasks.ts
import express from 'express';
import { getTasks, createTask } from '../controllers/tasks';

const router = express.Router();

router.get('/', getTasks);    // <-- this handles ?trackable=XYZ
router.post('/', createTask); // existing logic

export default router;
