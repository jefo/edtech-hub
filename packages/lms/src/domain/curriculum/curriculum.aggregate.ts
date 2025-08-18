import { z } from 'zod';
import { createAggregate } from '@sota/core/aggregate';
import { ModuleProps } from './module.entity';
import { CompetencyProps } from '@lms/domain/competency/competency.vo';

const CurriculumPropsSchema = z.object({
  id: z.string().uuid(),
  learnerId: z.string().uuid(),
  targetCompetencies: z.array(z.custom<CompetencyProps>()),
  modules: z.array(z.custom<ModuleProps>()),
});

export type CurriculumProps = z.infer<typeof CurriculumPropsSchema>;

export const Curriculum = createAggregate({
  name: 'Curriculum',
  schema: CurriculumPropsSchema,
  invariants: [],
  actions: {
    // Actions like startModule, completeModule could be added here later
  },
});

export type Curriculum = InstanceType<typeof Curriculum>;
