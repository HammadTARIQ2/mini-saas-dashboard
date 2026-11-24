import { type HydratedDocument, type InferSchemaType, Schema, model } from 'mongoose';

/** A person who can be assigned to projects. */
const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, required: true, trim: true, default: 'Member' },
  },
  { timestamps: true },
);

teamMemberSchema.index({ name: 1 });

export type TeamMemberAttrs = InferSchemaType<typeof teamMemberSchema>;
export type TeamMemberDocument = HydratedDocument<TeamMemberAttrs>;

export const TeamMemberModel = model('TeamMember', teamMemberSchema);
