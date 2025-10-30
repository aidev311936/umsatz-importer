import { Router } from 'express';
import { getMappings, saveMapping } from '../controllers/mappings.controller.js';

export const mappingsRouter = Router();

mappingsRouter.get('/', getMappings);
mappingsRouter.post('/', saveMapping);
