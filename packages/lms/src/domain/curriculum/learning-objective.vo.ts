import { z } from 'zod';
import { createValueObject } from '@sota/core/value-object';

const LearningObjectiveSchema = z.object({
  // In the future, this could have its own ID for linking to assessments
  description: z.string(),
});

export const LearningObjective = createValueObject(LearningObjectiveSchema);

export type LearningObjective = InstanceType<typeof LearningObjective>;
export type LearningObjectiveProps = z.infer<typeof LearningObjectiveSchema>;
