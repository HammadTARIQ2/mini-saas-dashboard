import type { TeamMember } from '@mini-saas/shared';
import type { Types } from 'mongoose';

/** Minimal shape needed to build a DTO — works for both documents and lean objects. */
export interface TeamMemberLike {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

export function toTeamMemberDto(member: TeamMemberLike): TeamMember {
  return {
    id: member._id.toString(),
    name: member.name,
    email: member.email,
    role: member.role,
  };
}
