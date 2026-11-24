import { type HydratedDocument, type InferSchemaType, Schema, model } from 'mongoose';
import { PROJECT_LIMITS, PROJECT_STATUSES } from '@mini-saas/shared';

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: PROJECT_LIMITS.NAME_MIN,
      maxlength: PROJECT_LIMITS.NAME_MAX,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: PROJECT_LIMITS.DESCRIPTION_MAX,
    },
    status: { type: String, enum: PROJECT_STATUSES, required: true, default: 'active' },
    deadline: { type: Date, required: true },
    /** Budget in whole currency units (USD). */
    budget: { type: Number, required: true, min: 0, max: PROJECT_LIMITS.BUDGET_MAX },
    assignee: { type: Schema.Types.ObjectId, ref: 'TeamMember', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Support the dashboard's most common access patterns.
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ assignee: 1 });

export type ProjectAttrs = InferSchemaType<typeof projectSchema>;
export type ProjectDocument = HydratedDocument<ProjectAttrs>;

export const ProjectModel = model('Project', projectSchema);
