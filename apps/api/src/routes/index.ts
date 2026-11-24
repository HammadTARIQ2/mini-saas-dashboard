import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { projectsRouter } from '../modules/projects/project.routes.js';
import { teamMembersRouter } from '../modules/team-members/team-members.routes.js';

/** Versioned API router mounted at `/api/v1`. */
export const apiRouter = Router();

// Public
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);

// Protected
apiRouter.use('/projects', requireAuth, projectsRouter);
apiRouter.use('/team-members', requireAuth, teamMembersRouter);
