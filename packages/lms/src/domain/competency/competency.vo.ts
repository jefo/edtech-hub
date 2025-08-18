import { z } from 'zod';
import { createValueObject } from '@sota/core/value-object';

// A level from 1 to 4 as per the DACUM methodology
const CompetencySchema = z.object({
  skillId: z.string().uuid(),
  level: z.number().min(1).max(4),
});

export const Competency = createValueObject(CompetencySchema);

export type Competency = InstanceType<typeof Competency>;
export type CompetencyProps = z.infer<typeof CompetencySchema>;
