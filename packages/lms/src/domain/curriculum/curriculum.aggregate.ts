import { z } from 'zod';
import { createAggregate } from '@sota/core/aggregate';

const CurriculumPropsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  // A curriculum is composed of an ordered list of module IDs.
  moduleIds: z.array(z.string().uuid()),
});

export type CurriculumProps = z.infer<typeof CurriculumPropsSchema>;

export const Curriculum = createAggregate({
  name: 'Curriculum',
  schema: CurriculumPropsSchema,
  invariants: [
    (state) => {
        if (state.moduleIds.length === 0) {
            throw new Error('Curriculum must contain at least one module.');
        }
    }
  ],
  actions: {
    changeTitle: (state: CurriculumProps, newTitle: string) => {
        return { state: { ...state, title: newTitle } };
    },
  },
});

export type Curriculum = InstanceType<typeof Curriculum>;