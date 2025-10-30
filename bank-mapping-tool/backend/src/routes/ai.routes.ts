import { Router } from 'express';
import { detectMapping } from '../controllers/ai.controller.js';

export const aiRouter = Router();

aiRouter.post('/detect', detectMapping);
