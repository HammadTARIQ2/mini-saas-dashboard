import type { Request, Response } from 'express';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  objectIdSchema,
  updateProjectSchema,
} from '@mini-saas/shared';
import { HttpError } from '../../lib/http-error.js';
import * as projectService from './project.service.js';

/** Validate the `:id` route param, responding 404 for malformed ids. */
function parseId(req: Request): string {
  const result = objectIdSchema.safeParse(req.params.id);
  if (!result.success) throw HttpError.notFound('Project not found');
  return result.data;
}

export async function list(req: Request, res: Response) {
  const query = listProjectsQuerySchema.parse(req.query);
  res.json(await projectService.listProjects(query));
}

export async function stats(_req: Request, res: Response) {
  res.json(await projectService.getProjectStats());
}

export async function getById(req: Request, res: Response) {
  res.json(await projectService.getProject(parseId(req)));
}

export async function create(req: Request, res: Response) {
  const input = createProjectSchema.parse(req.body);
  const project = await projectService.createProject(input, req.user!.id);
  res.status(201).location(`${req.baseUrl}/${project.id}`).json(project);
}

export async function update(req: Request, res: Response) {
  const id = parseId(req);
  const input = updateProjectSchema.parse(req.body);
  res.json(await projectService.updateProject(id, input));
}

export async function remove(req: Request, res: Response) {
  await projectService.deleteProject(parseId(req));
  res.status(204).end();
}
