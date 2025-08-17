import { z } from 'zod';
import { createValueObject } from '@sota/core/value-object';
import { SkillPropsSchema } from './skill.aggregate';

const SkillTreeSchema = z.object({
  skills: z.array(SkillPropsSchema),
  rootSkillIds: z.array(z.string().uuid()),
});

export const SkillTree = createValueObject(SkillTreeSchema);

export type SkillTree = InstanceType<typeof SkillTree>;
