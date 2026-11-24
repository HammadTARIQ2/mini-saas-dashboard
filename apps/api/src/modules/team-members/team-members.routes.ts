import { Router } from 'express';
import { toTeamMemberDto } from './team-member.mapper.js';
import { TeamMemberModel } from './team-member.model.js';

export const teamMembersRouter = Router();

/** GET /team-members — everyone who can be assigned to a project, sorted by name. */
teamMembersRouter.get('/', async (_req, res) => {
  const members = await TeamMemberModel.find().sort({ name: 1 }).lean();
  res.json({ data: members.map(toTeamMemberDto) });
});
