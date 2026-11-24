import { Router } from 'express';
import * as controller from './project.controller.js';

/**
 * /projects — all routes require authentication (applied in the API router).
 *
 *   GET    /           list with search, status filter, sorting and pagination
 *   GET    /stats      dashboard KPIs
 *   GET    /:id        single project
 *   POST   /           create
 *   PATCH  /:id        partial update
 *   DELETE /:id        delete
 */
export const projectsRouter = Router();

projectsRouter.get('/', controller.list);
projectsRouter.get('/stats', controller.stats);
projectsRouter.get('/:id', controller.getById);
projectsRouter.post('/', controller.create);
projectsRouter.patch('/:id', controller.update);
projectsRouter.delete('/:id', controller.remove);
